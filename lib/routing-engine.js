import { PLATFORM_TOPICS, CURRICULUM_TOPICS, lookupDeliveryCost } from './topic-data.js';

// Points per correct question gained (from sheets)
const POINTS_PER_CORRECT = 10;
// Sessions per curriculum topic (Phase 1 + Phase 2)
const SESSIONS_PER_TOPIC = 2;
// Shared-phase overhead (Phases 3-5: mixed sets, test sims, etc.)
const SHARED_PHASE_OVERHEAD = 0.43;
// Conversion rate: share of misses in taught topics the student actually converts
const CONVERSION_RATE = 0.5;
// R&W topics taught before inserting Wrong Answer Elimination session
const WAE_AFTER_RW_TOPICS = 5;
// Average seconds per SAT question above which a topic is flagged as speed-limited
// (SAT averages ~70s/question; >85s = student is losing time on this topic)
const SLOW_THRESHOLD_SECS = 85;

/**
 * computeProgram
 *
 * @param {Array} diagnosticEntries  — [{ platformName, qs, mastery }]
 *   qs: number of questions on the diagnostic for this topic
 *   mastery: mastery % (0-100)
 * @param {Object} studentInfo       — { baselineScore, targetScore, sessionFrequency, blanks,
 *                                       targetTestDate, programStartDate }
 *   sessionFrequency: '1x' | '2x' | '3x'
 *   blanks: number of questions left blank on diagnostic
 *   targetTestDate: 'YYYY-MM-DD' — when provided, constrains the plan to available sessions
 *   programStartDate: 'YYYY-MM-DD' — defaults to today if not set
 *
 * @returns {Object} { topicSequence, programSummary, weeklyPlan }
 */
export function computeProgram(diagnosticEntries, studentInfo) {
  const { baselineScore, targetScore, sessionFrequency = '2x', blanks = 0,
          targetTestDate, programStartDate, weeklySchedule } = studentInfo;
  const targetGain = targetScore - baselineScore;

  // ── Compute weeks/sessions until test date ───────────────────────────────
  const sessionsPerWeek = sessionFrequency === '3x' ? 3 : sessionFrequency === '2x' ? 2 : 1;
  let weeksUntilTest = null;
  let availableSessions = null;
  if (targetTestDate) {
    const start = programStartDate
      ? new Date(programStartDate + 'T00:00:00')
      : new Date();
    const test = new Date(targetTestDate + 'T00:00:00');
    weeksUntilTest = Math.max(0, Math.round((test - start) / (7 * 24 * 60 * 60 * 1000)));
    availableSessions = weeksUntilTest * sessionsPerWeek;
  }

  // ── Custom weekly schedule overrides session/slot count ───────────────────
  // Each session contributes floor(sessions × hoursPerSession) lesson slots per week.
  // A 1h session = 1 slot, 1.5h = 1 slot (single session), 2h = 2 slots.
  // Two 1.5h sessions = floor(3.0) = 3 slots (bonus over two 1h sessions).
  let totalScheduledSlots = null;
  let totalScheduledHours = null;
  if (weeklySchedule && weeklySchedule.length > 0) {
    totalScheduledSlots = weeklySchedule.reduce((sum, w) => sum + Math.floor(w.sessions * w.hoursPerSession), 0);
    totalScheduledHours = weeklySchedule.reduce((sum, w) => sum + w.sessions * w.hoursPerSession, 0);
    if (weeksUntilTest === null) weeksUntilTest = weeklySchedule.length;
    availableSessions = totalScheduledSlots; // slots replace fixed session count
  }

  // ── Step 1: Aggregate misses and mastery by curriculum topic ─────────────
  const missMap = {};     // curriculumTopic → total misses
  const masteryMap = {};  // curriculumTopic → { totalQs, totalCorrect }
  const timeMap = {};     // curriculumTopic → { totalWeightedSecs, totalQs } for weighted avg
  for (const entry of diagnosticEntries) {
    if (!entry.qs || entry.qs === 0) continue;
    const platform = PLATFORM_TOPICS.find(p => p.platformName === entry.platformName);
    if (!platform) continue;
    const correct = entry.qs * ((entry.mastery || 0) / 100);
    const misses  = entry.qs - correct;
    missMap[platform.curriculumTopic] = (missMap[platform.curriculumTopic] || 0) + misses;
    if (!masteryMap[platform.curriculumTopic]) masteryMap[platform.curriculumTopic] = { totalQs: 0, totalCorrect: 0 };
    masteryMap[platform.curriculumTopic].totalQs      += entry.qs;
    masteryMap[platform.curriculumTopic].totalCorrect += correct;
    // Track average time per question (weighted by question count)
    if (entry.avgTimeSecs != null && entry.avgTimeSecs > 0) {
      if (!timeMap[platform.curriculumTopic]) timeMap[platform.curriculumTopic] = { totalWeightedSecs: 0, totalQs: 0 };
      timeMap[platform.curriculumTopic].totalWeightedSecs += entry.avgTimeSecs * entry.qs;
      timeMap[platform.curriculumTopic].totalQs           += entry.qs;
    }
  }

  function getAvgTimeSecs(curriculumTopicName) {
    const t = timeMap[curriculumTopicName];
    if (!t || t.totalQs === 0) return null;
    return Math.round(t.totalWeightedSecs / t.totalQs);
  }

  function getStartTier(curriculumTopicName) {
    const m = masteryMap[curriculumTopicName];
    if (!m || m.totalQs === 0) return 'Foundational';
    const pct = m.totalCorrect / m.totalQs * 100;
    if (pct >= 90) return 'Optimization';
    if (pct >= 55) return 'Developing';
    return 'Foundational';
  }

  // ── Step 2: Cross-reference with curriculum topic data ────────────────────
  const scorableCurriculumTopics = CURRICULUM_TOPICS.filter(t => t.tier > 0); // exclude pacing/WAE
  const topicsWithMisses = scorableCurriculumTopics.map(ct => ({
    ...ct,
    misses: +(missMap[ct.topic] || 0).toFixed(2),
  }));

  // ── Step 3: Sort within each section by misses desc, break ties by tier ──
  topicsWithMisses.sort((a, b) => {
    if (b.misses !== a.misses) return b.misses - a.misses;
    return a.tier - b.tier;
  });

  // Split into per-section ranked lists for balanced selection
  const rwRanked   = topicsWithMisses.filter(t => t.section === 'R&W' && t.misses > 0);
  const mathRanked = topicsWithMisses.filter(t => t.section === 'Math' && t.misses > 0);
  const rwTotalMisses   = rwRanked.reduce((s, t) => s + t.misses, 0);
  const mathTotalMisses = mathRanked.reduce((s, t) => s + t.misses, 0);
  const sectionTotal    = rwTotalMisses + mathTotalMisses;

  // ── Step 4: How many points do we need to gain? ───────────────────────────
  const correctAnswersNeeded = Math.ceil(targetGain / POINTS_PER_CORRECT);
  // Account for blank questions (pacing issue, only partly fixable through content teaching)
  const missesFromBlanks = blanks * 0.5;
  const missesToConvert = correctAnswersNeeded - missesFromBlanks;

  // ── Step 5: Proportional interleaved selection across R&W and Math ────────
  // Always picks the highest-miss topic from whichever section is currently
  // underrepresented relative to its share of total misses. This prevents a
  // Math-heavy diagnostic from producing an all-Math gameplan.
  let cumulativeMisses = 0;
  const selectedTopics = [];
  let rwIdx = 0, mathIdx = 0;

  while (selectedTopics.length < 20) {
    const rwDone   = rwIdx   >= rwRanked.length;
    const mathDone = mathIdx >= mathRanked.length;
    if (rwDone && mathDone) break;

    // Compute each section's current share of selected misses
    const selRwMisses   = selectedTopics.filter(t => t.section === 'R&W').reduce((s, t) => s + t.misses, 0);
    const selMathMisses = selectedTopics.filter(t => t.section === 'Math').reduce((s, t) => s + t.misses, 0);
    const selTotal      = selRwMisses + selMathMisses;

    // Pick from the section most behind its target share; fall back if one is exhausted
    let pickRW;
    if (rwDone)   { pickRW = false; }
    else if (mathDone) { pickRW = true; }
    else {
      const rwTargetShare = sectionTotal > 0 ? rwTotalMisses / sectionTotal : 0.5;
      const rwActualShare = selTotal > 0 ? selRwMisses / selTotal : 0;
      pickRW = rwActualShare <= rwTargetShare;
    }

    const topic = pickRW ? rwRanked[rwIdx++] : mathRanked[mathIdx++];
    selectedTopics.push(topic);
    cumulativeMisses += topic.misses;
    if (cumulativeMisses * CONVERSION_RATE >= missesToConvert) break;
  }

  // Feasibility assessment
  const totalDiagnosticMisses = Object.values(missMap).reduce((s, v) => s + v, 0);
  const maxConvertiblePoints = totalDiagnosticMisses * CONVERSION_RATE * POINTS_PER_CORRECT + missesFromBlanks * POINTS_PER_CORRECT;
  const feasibility =
    maxConvertiblePoints >= targetGain * 0.95 ? 'reachable' :
    maxConvertiblePoints >= targetGain * 0.70 ? 'tight' : 'unlikely';

  // ── Step 6: Build topic sequence with session numbers ─────────────────────
  const needsPacing = blanks > 5;
  let sessionCounter = 0;
  const topicSequence = [];

  const pacingCt = CURRICULUM_TOPICS.find(t => t.topic === 'Pacing, Triage & Test Execution');
  const waeCt    = CURRICULUM_TOPICS.find(t => t.topic === 'Wrong Answer Elimination');

  if (needsPacing) {
    sessionCounter += 1;
    topicSequence.push({
      rank: 1,
      topic: 'Pacing, Triage & Test Execution',
      section: 'Cross',
      domain: 'Cross-Section',
      tier: 0,
      tierLabel: 'Pacing',
      startTier: null,
      misses: 0,
      ptsPerSession: 0,
      phase1Session: sessionCounter,
      phase2Session: null,
      gate3Week: null,
      notionUrl: pacingCt?.notionPageId ? `https://www.notion.so/${pacingCt.notionPageId}` : null,
      isPacing: true,
    });
  }

  let rwTopicCount = 0;
  let waeInserted = false;

  for (let i = 0; i < selectedTopics.length; i++) {
    const ct = selectedTopics[i];
    sessionCounter += 1;
    const phase1Session = sessionCounter;
    sessionCounter += 1;
    const phase2Session = sessionCounter;

    // Gate 3 check: ~3 weeks after Phase 2 (21 days)
    const gate3Session = phase2Session + Math.ceil(3 * (sessionFrequency === '3x' ? 3 : sessionFrequency === '2x' ? 2 : 1));

    const avgTimeSecs = getAvgTimeSecs(ct.topic);
    const startTier   = getStartTier(ct.topic);
    // Flag topics where student is accurate but too slow — needs speed emphasis from session 1
    const needsSpeedFocus = avgTimeSecs != null
      && avgTimeSecs > SLOW_THRESHOLD_SECS
      && startTier !== 'Foundational'; // foundational topics need content first, not speed

    topicSequence.push({
      rank: topicSequence.length + 1,
      topic: ct.topic,
      section: ct.section,
      domain: ct.domain,
      tier: ct.tier,
      tierLabel: ct.tierLabel,
      startTier,
      misses: ct.misses,
      avgTimeSecs,
      ptsPerSession: ct.ptsPerSession,
      phase1Session,
      phase2Session,
      gate3Session,
      notionUrl: ct.notionPageId ? `https://www.notion.so/${ct.notionPageId}` : null,
      isPacing: false,
      needsSpeedFocus,
    });

    if (ct.section === 'R&W') rwTopicCount++;

    // Insert Wrong Answer Elimination after WAE_AFTER_RW_TOPICS R&W topics
    if (!waeInserted && rwTopicCount >= WAE_AFTER_RW_TOPICS) {
      sessionCounter += 1;
      topicSequence.push({
        rank: topicSequence.length + 1,
        topic: 'Wrong Answer Elimination',
        section: 'R&W',
        domain: 'Cross-Domain Strategy',
        tier: 0,
        tierLabel: 'Cross-Cutting',
        startTier: null,
        misses: 0,
        ptsPerSession: 0,
        phase1Session: sessionCounter,
        phase2Session: null,
        gate3Session: null,
        notionUrl: waeCt?.notionPageId ? `https://www.notion.so/${waeCt.notionPageId}` : null,
        isWAE: true,
      });
      waeInserted = true;
    }
  }

  // ── Step 7: Build explicit week-by-week plan ─────────────────────────────
  const coreSessionsNeeded = sessionCounter;
  const { plan: fullWeeklyPlan, totalSessions: fullSessionsNeeded } = buildWeeklyPlan(
    topicSequence, sessionsPerWeek, weeklySchedule,
    { baselineScore, targetGain, planTopicsCount: selectedTopics.length }
  );
  const fullWeeksNeeded = Math.ceil(fullSessionsNeeded / sessionsPerWeek);

  // If a test date is set, constrain the plan to sessions available before it
  const isConstrained = availableSessions !== null && availableSessions < fullSessionsNeeded;
  const weeklyPlan = isConstrained ? fullWeeklyPlan.slice(0, availableSessions) : fullWeeklyPlan;
  const totalSessionsNeeded = weeklyPlan.length;
  const weeksNeeded = isConstrained ? weeksUntilTest : fullWeeksNeeded;

  // Count topics fully covered (both Phase 1 and Phase 2 present in constrained plan)
  const coveredTopicNames = new Set();
  const seenPhase1 = new Set();
  for (const s of weeklyPlan) {
    if (s.phase === 'Phase 1' && s.gate !== 'WAE') seenPhase1.add(s.topic.replace(' — Speed Review', ''));
    if (s.phase === 'Phase 2') {
      const base = s.topic.replace(' — Speed Review', '');
      if (seenPhase1.has(base)) coveredTopicNames.add(base);
    }
  }
  const topicsToTeach = isConstrained ? coveredTopicNames.size : selectedTopics.length;

  const deliveryCost = lookupDeliveryCost(baselineScore, targetScore);

  // ── Step 8: Program summary ───────────────────────────────────────────────
  const programSummary = {
    topicsToTeach,
    coreSessionsNeeded,
    totalSessionsNeeded,
    sessionsPerWeek,
    weeksNeeded,
    weeksUntilTest,
    availableSessions,
    isConstrained,
    feasibility,
    targetGain,
    correctAnswersNeeded,
    totalDiagnosticMisses: +totalDiagnosticMisses.toFixed(1),
    missesToConvert: +missesToConvert.toFixed(1),
    blanks,
    needsPacing,
    // Custom schedule totals
    totalScheduledHours: totalScheduledHours != null ? +totalScheduledHours.toFixed(1) : null,
    // From delivery cost table
    paidSessions: deliveryCost?.paid || null,
    medianFreeSessions: deliveryCost?.medianFree ?? null,
    p90FreeSessions: deliveryCost?.p90Free ?? null,
    priceFor: deliveryCost?.priceFor || null,
    contractCap: deliveryCost?.cap || null,
    guaranteeStatus: deliveryCost
      ? (deliveryCost.attempts <= 1 && deliveryCost.medianFree === 0 ? 'Yes — guarantee' : 'Conditional')
      : 'Unknown',
  };

  return { topicSequence, programSummary, weeklyPlan };
}

function buildWeeklyPlan(topicSequence, sessionsPerWeek, weeklySchedule, projectionParams) {
  const { baselineScore = null, targetGain = 0, planTopicsCount = 1 } = projectionParams || {};

  const sessions = [];
  let contentCount           = 0;
  let contentTopicsCompleted = 0; // increments after each Phase 2
  let phase3Buffer           = 0;
  let phase4Buffer           = 0;
  let practiceTestNum        = 0;

  for (const t of topicSequence) {
    if (t.isPacing) {
      sessions.push({
        topic: t.topic, phase: 'Pacing',
        gate: 'Pre-req', gateTarget: 'Timing strategy + triage system',
        section: 'Cross', startTier: null, notionUrl: t.notionUrl, isSharedPhase: false,
        homework: 'Review SAT timing rules · bring your diagnostic to next session',
        isCheckpoint: false,
      });
      continue;
    }
    if (t.isWAE) {
      sessions.push({
        topic: t.topic, phase: 'Phase 1',
        gate: 'WAE', gateTarget: 'Distractor recognition · Pattern chart',
        section: 'R&W', startTier: null, notionUrl: t.notionUrl, isSharedPhase: false,
        homework: 'Complete the Wrong Answer Elimination worksheet from this session',
        isCheckpoint: false,
      });
      continue;
    }

    // ── Phase 1 — content mastery ──────────────────────────────────────────
    // Speed-flagged topics: student is accurate but slow — prioritise pace from session 1
    const speedGateNote = t.needsSpeedFocus
      ? ` · ⚡ Speed-flagged (avg ${t.avgTimeSecs}s/q) — prioritise pace from session 1`
      : '';
    const ph1Homework = t.needsSpeedFocus
      ? `10 TIMED questions on ${t.topic} from the Question Bank · target 9/10 correct under time (pace matters here from day 1)`
      : `10 untimed Quiz/Practice questions on ${t.topic} · use the Question Bank`;

    sessions.push({
      topic: t.topic, phase: 'Phase 1',
      gate: 'Gate 1', gateTarget: `9/10 untimed · Start: ${t.startTier}${speedGateNote}`,
      section: t.section, startTier: t.startTier, notionUrl: t.notionUrl, isSharedPhase: false,
      homework: ph1Homework,
      needsSpeedFocus: !!t.needsSpeedFocus,
      isCheckpoint: false,
    });

    // ── Phase 2 — speed drills + 3-week retention scheduling ───────────────
    // All topics get a spaced-review assignment 3 weeks out as a retention check
    const ph2Homework = t.needsSpeedFocus
      ? `3 timed sets on ${t.topic} · target 90%+ in <75 sec/question · assign a 5-question spaced review from the Question Bank in 3 weeks`
      : `2 timed practice sets on ${t.topic} · target 90%+ accuracy · assign a 5-question untimed spaced review from the Question Bank in 3 weeks`;

    sessions.push({
      topic: `${t.topic} — Speed Review`, phase: 'Phase 2',
      gate: 'Gate 2', gateTarget: '90%+ timed ×2 (95% for Conventions)',
      section: t.section, startTier: null, notionUrl: t.notionUrl, isSharedPhase: false,
      homework: ph2Homework,
      isCheckpoint: false,
    });

    contentTopicsCompleted++;
    contentCount++;
    phase3Buffer++;
    phase4Buffer++;

    // ── Phase 3 after every 3 content topics ───────────────────────────────
    if (phase3Buffer >= 3) {
      const projectedScore = (baselineScore != null && planTopicsCount > 0)
        ? Math.round(baselineScore + (contentTopicsCompleted / planTopicsCount) * targetGain)
        : null;
      sessions.push({
        topic: projectedScore != null ? `Error Pattern Analysis · Est. ~${projectedScore}` : 'Error Pattern Analysis',
        phase: 'Phase 3',
        gate: 'Phase 3',
        gateTarget: 'Tag each error: Conceptual Gap · Rushing/Careless · Reading Misunderstanding · Trap Answer',
        section: 'Mixed', startTier: null, notionUrl: null, isSharedPhase: true,
        homework: 'Before session: label each missed question from the past 3 topics as: Conceptual Gap / Rushing / Reading / Trap Answer · bring your categorised list',
        projectedScore,
        isCheckpoint: false,
      });
      phase3Buffer = 0;
    }

    // ── Phase 4 after every 6 content topics ───────────────────────────────
    if (phase4Buffer >= 6) {
      practiceTestNum++;
      sessions.push({
        topic: `Practice Test Review #${practiceTestNum}`, phase: 'Phase 4',
        gate: 'Phase 4', gateTarget: 'Conversion rate logged · Topics re-ranked · error patterns revisited',
        section: 'Full Test', startTier: null, notionUrl: null, isSharedPhase: true,
        homework: 'Take a Full-Length Practice Test before this session · bring your score report',
        isCheckpoint: true,
      });
      phase4Buffer = 0;
    }
  }

  // Final Phase 3 for any leftover topics (< 3)
  if (phase3Buffer > 0) {
    const projectedScore = (baselineScore != null && planTopicsCount > 0)
      ? Math.round(baselineScore + (contentTopicsCompleted / planTopicsCount) * targetGain)
      : null;
    sessions.push({
      topic: projectedScore != null ? `Error Pattern Analysis · Est. ~${projectedScore}` : 'Error Pattern Analysis',
      phase: 'Phase 3',
      gate: 'Phase 3',
      gateTarget: 'Tag each error: Conceptual Gap · Rushing/Careless · Reading Misunderstanding · Trap Answer',
      section: 'Mixed', startTier: null, notionUrl: null, isSharedPhase: true,
      homework: 'Before session: label each missed question from the past 3 topics as: Conceptual Gap / Rushing / Reading / Trap Answer · bring your categorised list',
      projectedScore,
      isCheckpoint: false,
    });
  }

  // Final Phase 4 if not done recently
  if (phase4Buffer > 2) {
    practiceTestNum++;
    sessions.push({
      topic: `Practice Test Review #${practiceTestNum}`, phase: 'Phase 4',
      gate: 'Phase 4', gateTarget: 'Conversion rate logged · Topics re-ranked · error patterns revisited',
      section: 'Full Test', startTier: null, notionUrl: null, isSharedPhase: true,
      homework: 'Take a Full-Length Practice Test before this session · bring your score report',
      isCheckpoint: true,
    });
  }

  // Phase 5 budget: ~25% of content topics (only where Phase 4 flags a topic)
  const phase5Count = Math.round(contentCount * 0.25);
  for (let i = 0; i < phase5Count; i++) {
    sessions.push({
      topic: 'Weak Point Deep Dive', phase: 'Phase 5',
      gate: 'Phase 5', gateTarget: 'Topic reaches 85%+ · Only runs if Phase 4 flags it',
      section: 'Varies', startTier: null, notionUrl: null, isSharedPhase: true,
      homework: '10–15 additional practice questions on the flagged topic',
      isCheckpoint: false,
    });
  }

  // Build slot-to-week map from custom schedule (each slot = one lesson phase)
  let slotToWeek = null;
  if (weeklySchedule && weeklySchedule.length > 0) {
    slotToWeek = [];
    for (const wk of weeklySchedule) {
      const slots = Math.floor(wk.sessions * wk.hoursPerSession);
      for (let s = 0; s < slots; s++) slotToWeek.push(wk.week);
    }
  }

  // Number sessions and assign to weeks
  const plan = [];
  let week = 1;
  let sessionInWeek = 0;
  let lastMappedWeek = 1;
  for (let i = 0; i < sessions.length; i++) {
    let assignedWeek;
    if (slotToWeek) {
      assignedWeek = i < slotToWeek.length ? slotToWeek[i] : lastMappedWeek;
      lastMappedWeek = assignedWeek;
    } else {
      sessionInWeek++;
      if (sessionInWeek > sessionsPerWeek) { week++; sessionInWeek = 1; }
      assignedWeek = week;
    }
    plan.push({ ...sessions[i], week: assignedWeek, session: i + 1 });
  }

  // Mark the last Phase 4 as the Final Practice Test (2-week-before anchor)
  for (let i = plan.length - 1; i >= 0; i--) {
    if (plan[i].phase === 'Phase 4') {
      plan[i].isFinalPracticeTest = true;
      plan[i].topic = 'Final Practice Test';
      plan[i].gateTarget = 'FINAL ASSESSMENT — Confirm score trajectory · identify weak points for the last 2-week push';
      plan[i].homework = 'Take a Full-Length Practice Test under real test conditions · bring score report — this is your benchmark before the real SAT';
      break;
    }
  }

  return { plan, totalSessions: sessions.length };
}
