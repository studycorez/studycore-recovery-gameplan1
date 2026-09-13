import { computeProgram } from '../../../lib/routing-engine';
import { buildGameplanPdf } from '../../../lib/pdf-gameplan-new';
import { buildInternalPlanPdf } from '../../../lib/pdf-internal-plan';
import { buildStudentPlanPdf } from '../../../lib/pdf-student-plan';
import { createStudentTracker } from '../../../lib/google-sheets';
import { generateGameplanNarratives } from '../../../lib/gameplan-rules';

const BAND_MASTERY = {
  'Below 400': 22, '400\u2013450': 33, '450\u2013500': 44, '490\u2013540': 50,
  '500\u2013550': 56, '550\u2013600': 63, '610\u2013670': 72, '680\u2013760': 82, '680\u2013800': 88,
};
const DOMAIN_PLATFORM_TOPICS = {
  cs:   ['Words in context','Text structure and purpose','Cross-text connections','Part-to-whole relationships'],
  ii:   ['Central ideas and details','Command of Evidence - Textual','Command of Evidence - Quantitative','Inferences'],
  eoi:  ['Rhetorical Synthesis','Transitions'],
  sec:  ['Boundaries','Subject-verb agreement','Pronoun-antecedent agreement','Plural & Possessives'],
  alg:  ['Linear equations in one variable','Linear Equation (Word Problems)','Linear equations in two variables','Systems of two linear equations in two variables','Linear inequalities in one or two variables'],
  am:   ['Nonlinear equations','Quadratic equations','Nonlinear functions','Equivalent expressions','Exponents & Radicals'],
  psda: ['Ratios, Rates, And Proportions','Percentages','Probability','Calculating Mean','Two-variable data - scatter plots'],
  gt:   ['Right Triangle Geometry','Lines, angles, and triangles','Circle Theorems','Area'],
};
function normBand(b) { return b ? b.replace(/[-\u2013]/g,'\u2013').trim() : null; }
function inferDiagnosticFromBands(domains, coveredTopics = []) {
  const entries = [];
  const covered = new Set((coveredTopics||[]).map(t=>t.toLowerCase()));
  for (const [key, bandStr] of Object.entries(domains||{})) {
    const topics = DOMAIN_PLATFORM_TOPICS[key]; if(!topics) continue;
    const mastery = BAND_MASTERY[normBand(bandStr)] ?? 50;
    for (const platformName of topics) {
      const isCovered = covered.has(platformName.toLowerCase());
      entries.push({ platformName, qs: 4, mastery: isCovered ? Math.max(mastery, 78) : mastery, avgTimeSecs: 80 });
    }
  }
  return entries;
}

export const maxDuration = 120;

export async function POST(request) {
  const encoder = new TextEncoder();
  function line(controller, obj) {
    controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let body;
        try { body = await request.json(); }
        catch { line(controller, { status: 'error', error: 'Invalid request body.' }); return; }

        let { studentData, diagnosticEntries: rawEntries, guaranteeMode } = body;
        let diagnosticEntries = rawEntries;

        const missing = [];
        if (!studentData?.studentName) missing.push('studentName');
        if (!studentData?.baselineScore) missing.push('baselineScore');
        if (!studentData?.targetScore) missing.push('targetScore');
        if (!guaranteeMode || !studentData?.guaranteeDomains) {
          if (!diagnosticEntries || diagnosticEntries.length === 0) missing.push('diagnosticEntries');
        }
        if (missing.length > 0) {
          line(controller, { status: 'error', error: `Missing required fields: ${missing.join(', ')}` });
          return;
        }

        if (guaranteeMode && (!diagnosticEntries || diagnosticEntries.length === 0)) {
          diagnosticEntries = inferDiagnosticFromBands(studentData.guaranteeDomains, studentData.coveredTopics || []);
        }

        // Propagate guaranteeMode into studentData for PDF builders
        if (guaranteeMode) studentData = { ...studentData, guaranteeMode: true };

        // Step 1: Routing engine
        line(controller, { status: 'generating', message: 'Computing topic sequence from diagnostic…' });
        const routingResult = computeProgram(diagnosticEntries, {
          baselineScore:    parseInt(studentData.baselineScore, 10),
          targetScore:      parseInt(studentData.targetScore, 10),
          sessionFrequency: studentData.sessionFrequency || '2x',
          blanks:           parseInt(studentData.blanks || 0, 10),
          targetTestDate:   studentData.targetTestDate || null,
          programStartDate: studentData.programStartDate || null,
        });
        line(controller, {
          status: 'routing_complete',
          message: `Routing complete — ${routingResult.programSummary.topicsToTeach} topics, ${routingResult.programSummary.totalSessionsNeeded} sessions, ${routingResult.programSummary.weeksNeeded} weeks`,
          programSummary: routingResult.programSummary,
        });

        // Step 2: Rule-based narratives (no Claude API call)
        line(controller, { status: 'generating', message: 'Generating rule-based narratives…' });
        const narratives = generateGameplanNarratives(studentData, routingResult);

        // Step 3: Build all three PDFs in parallel
        line(controller, { status: 'building', message: 'Building PDFs (gameplan, internal brief, student plan)…' });
        let gameplanBuffer, internalBuffer, studentBuffer;
        try {
          [gameplanBuffer, internalBuffer, studentBuffer] = await Promise.all([
            buildGameplanPdf(studentData, routingResult, narratives),
            buildInternalPlanPdf(studentData, routingResult),
            buildStudentPlanPdf(studentData, routingResult),
          ]);
        } catch (err) {
          line(controller, { status: 'error', error: `PDF build error: ${err.message}` });
          return;
        }

        // Step 4: Create Google Sheet tracker
        line(controller, { status: 'building', message: 'Creating Mastery Tracker Google Sheet…' });
        let trackerUrl = null;
        try {
          trackerUrl = await createStudentTracker(studentData, routingResult.topicSequence);
        } catch (err) {
          console.warn('[generate] Tracker creation failed:', err?.message);
        }

        // Step 5: Return results
        line(controller, {
          status: 'done',
          gameplanBase64:      Buffer.from(gameplanBuffer).toString('base64'),
          internalPlanBase64:  Buffer.from(internalBuffer).toString('base64'),
          studentPlanBase64:   Buffer.from(studentBuffer).toString('base64'),
          trackerUrl:          trackerUrl || null,
          studentName:         studentData.studentName,
          programSummary:      routingResult.programSummary,
        });

      } catch (err) {
        try { line(controller, { status: 'error', error: `Unexpected error: ${err?.message ?? String(err)}` }); } catch {}
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
