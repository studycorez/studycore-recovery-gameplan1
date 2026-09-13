// Required environment variables (set in Vercel dashboard, not .env.local):
//   POSTGRES_URL — Vercel Postgres connection string

import { sql } from '@vercel/postgres';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS gameplans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      student_name TEXT NOT NULL,
      tutor_name TEXT,
      baseline_score INTEGER,
      target_score INTEGER,
      target_gain INTEGER,
      target_test_date TEXT,
      session_frequency TEXT,
      topics_to_teach INTEGER,
      total_sessions INTEGER,
      weeks_needed INTEGER,
      feasibility TEXT,
      guarantee_mode BOOLEAN DEFAULT FALSE,
      gameplan_pdf_url TEXT,
      internal_pdf_url TEXT,
      student_pdf_url TEXT,
      tracker_url TEXT
    )
  `;
}

export async function saveGameplan(params) {
  await ensureTable();

  const {
    studentName,
    tutorName = null,
    baselineScore = null,
    targetScore = null,
    targetTestDate = null,
    sessionFrequency = null,
    guaranteeMode = false,
    programSummary = {},
    gameplanPdfUrl = null,
    internalPdfUrl = null,
    studentPdfUrl = null,
    trackerUrl = null,
  } = params;

  const targetGain = baselineScore != null && targetScore != null
    ? targetScore - baselineScore
    : null;

  const topicsToTeach   = programSummary?.topicsToTeach   ?? null;
  const totalSessions   = programSummary?.totalSessionsNeeded ?? null;
  const weeksNeeded     = programSummary?.weeksNeeded     ?? null;
  const feasibility     = programSummary?.feasibility     ?? null;

  const result = await sql`
    INSERT INTO gameplans (
      student_name, tutor_name, baseline_score, target_score,
      target_gain, target_test_date, session_frequency,
      topics_to_teach, total_sessions, weeks_needed, feasibility,
      guarantee_mode, gameplan_pdf_url, internal_pdf_url, student_pdf_url, tracker_url
    ) VALUES (
      ${studentName}, ${tutorName}, ${baselineScore}, ${targetScore},
      ${targetGain}, ${targetTestDate}, ${sessionFrequency},
      ${topicsToTeach}, ${totalSessions}, ${weeksNeeded}, ${feasibility},
      ${guaranteeMode}, ${gameplanPdfUrl}, ${internalPdfUrl}, ${studentPdfUrl}, ${trackerUrl}
    )
    RETURNING *
  `;
  return result.rows;
}

export async function searchGameplans(query, limit = 50) {
  await ensureTable();

  if (query && query.trim()) {
    const pattern = `%${query.trim()}%`;
    const result = await sql`
      SELECT * FROM gameplans
      WHERE student_name ILIKE ${pattern}
         OR tutor_name   ILIKE ${pattern}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  }

  const result = await sql`
    SELECT * FROM gameplans
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}
