import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

// GET /api/contracts/strikes?email=xxx — get strikes for a tutor
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const supabase = getSupabase();

    let q = supabase.from('tutor_strikes').select('*').order('created_at', { ascending: false });
    if (email) q = q.eq('tutor_email', email);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/contracts/strikes — add a strike
export async function POST(req) {
  try {
    const { tutorName, tutorEmail, reason, studentName } = await req.json();
    if (!tutorName || !tutorEmail || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Count existing strikes to determine next strike number
    const { count } = await supabase
      .from('tutor_strikes')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_email', tutorEmail);

    const strikeNum = (count || 0) + 1;

    const { error } = await supabase.from('tutor_strikes').insert([{
      tutor_name: tutorName,
      tutor_email: tutorEmail,
      reason,
      student_name: studentName || null,
      strike_num: strikeNum,
    }]);

    if (error) throw error;
    return NextResponse.json({ success: true, strikeNum });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/contracts/strikes?id=xxx — remove a strike
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase.from('tutor_strikes').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
