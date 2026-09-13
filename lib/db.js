// Required environment variables (injected automatically by Vercel Supabase integration):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_ANON_KEY
// The gameplans table must be created manually in Supabase SQL Editor (see README or setup notes).

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

export async function saveGameplan(params) {
  const supabase = getSupabase();
  const {
    studentName, tutorName, baselineScore, targetScore,
    targetTestDate, sessionFrequency, guaranteeMode,
    programSummary, trackerUrl,
  } = params;

  const { error } = await supabase.from('gameplans').insert([{
    student_name:     studentName,
    tutor_name:       tutorName || null,
    baseline_score:   baselineScore || null,
    target_score:     targetScore || null,
    target_gain:      programSummary?.targetGain ?? null,
    target_test_date: targetTestDate || null,
    session_frequency: sessionFrequency || null,
    topics_to_teach:  programSummary?.topicsToTeach ?? null,
    total_sessions:   programSummary?.totalSessionsNeeded ?? null,
    weeks_needed:     programSummary?.weeksNeeded ?? null,
    feasibility:      programSummary?.feasibility || null,
    guarantee_mode:   !!guaranteeMode,
    tracker_url:      trackerUrl || null,
  }]);

  if (error) throw error;
}

export async function searchGameplans(query = '', limit = 50) {
  const supabase = getSupabase();

  let q = supabase
    .from('gameplans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query && query.trim()) {
    q = q.or(`student_name.ilike.%${query.trim()}%,tutor_name.ilike.%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
