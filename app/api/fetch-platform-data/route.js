export const maxDuration = 30;

import { saveDomainScores } from '../../../lib/db';

async function gql(query, variables, sessionCookie) {
  const res = await fetch('https://my.studycore.net/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function POST(request) {
  try {
    const { studentId, studentName, sessionCookie } = await request.json();

    if (!studentId || !sessionCookie) {
      return Response.json({ error: 'studentId and sessionCookie are required.' }, { status: 400 });
    }

    // GraphQL call 1 — get attempts
    const attemptsData = await gql(
      `query GetStudentAttempts($studentId: ID!) {
        getStudentAttempts(studentId: $studentId) {
          id
          createdAt
          status
          score {
            sat {
              total
              reading
              math
            }
          }
        }
      }`,
      { studentId },
      sessionCookie
    );

    const allAttempts = attemptsData.getStudentAttempts || [];
    const finished = allAttempts
      .filter(a => a.status === 'finished' && a.score?.sat?.total != null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (finished.length === 0) {
      return Response.json({ error: 'No finished SAT attempts found for this student.' }, { status: 404 });
    }

    const latest = finished[0];

    // GraphQL call 2 — get questions
    const questionsData = await gql(
      `query GetAttemptQuestions($attemptId: ID!, $showAnswers: Boolean!) {
        getAttemptQuestions(attemptId: $attemptId, showAnswers: $showAnswers) {
          id
          isCorrect
          timeTaken
          domains {
            subjectName
            unitName
          }
        }
      }`,
      { attemptId: latest.id, showAnswers: true },
      sessionCookie
    );

    const questions = questionsData.getAttemptQuestions || [];

    // Aggregate by unitName
    const domainMap = {};
    for (const q of questions) {
      const unitName = q.domains?.[0]?.unitName;
      if (!unitName) continue;
      if (!domainMap[unitName]) {
        domainMap[unitName] = { correct: 0, total: 0, timeMs: [], subjectName: q.domains?.[0]?.subjectName || null };
      }
      domainMap[unitName].total += 1;
      if (q.isCorrect === true) domainMap[unitName].correct += 1;
      if (q.timeTaken != null && q.timeTaken > 0) domainMap[unitName].timeMs.push(q.timeTaken);
    }

    const diagnosticEntries = Object.entries(domainMap).map(([unitName, d]) => {
      const avgTimeSecs = d.timeMs.length > 0
        ? Math.round(d.timeMs.reduce((s, t) => s + t, 0) / d.timeMs.length / 1000)
        : undefined;
      return {
        platformName: unitName,
        qs: d.total,
        mastery: Math.round((d.correct / d.total) * 100),
        ...(avgTimeSecs != null ? { avgTimeSecs } : {}),
      };
    });

    // Save to domain_scores table — failure should not block the response
    try {
      const domainRows = Object.entries(domainMap).map(([unitName, d]) => ({
        subject: d.subjectName,
        domain: unitName,
        correct: d.correct,
        total: d.total,
        accuracy_pct: Math.round((d.correct / d.total) * 100),
      }));
      await saveDomainScores(
        studentId,
        studentName || null,
        latest.createdAt.slice(0, 10),
        latest.score.sat.total,
        domainRows
      );
    } catch (dbErr) {
      console.error('domain_scores save failed (non-blocking):', dbErr.message);
    }

    return Response.json({
      diagnosticEntries,
      baselineScore: latest.score.sat.total,
      rwScore: latest.score.sat.reading || null,
      mathScore: latest.score.sat.math || null,
      testDate: latest.createdAt.slice(0, 10),
      attemptId: latest.id,
      questionCount: questions.length,
      domainCount: Object.keys(domainMap).length,
    });
  } catch (err) {
    console.error('/api/fetch-platform-data error:', err.message);
    return Response.json({ error: err.message || 'Failed to fetch platform data.' }, { status: 500 });
  }
}
