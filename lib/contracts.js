import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

/**
 * Create a new pending contract record and return the signing token.
 * @param {'tutor'|'student'} type
 * @param {string} recipientName
 * @param {string} recipientEmail
 * @param {object} contractData  — all variable fields for the contract
 */
export async function createContract({ type, recipientName, recipientEmail, contractData }) {
  const supabase = getSupabase();
  const token = randomUUID();

  const { error } = await supabase.from('signing_contracts').insert([{
    token,
    type,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    contract_data: contractData,
    status: 'pending',
  }]);

  if (error) throw error;
  return token;
}

/**
 * Fetch a contract by its signing token.
 */
export async function getContractByToken(token) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('signing_contracts')
    .select('*')
    .eq('token', token)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark a contract as signed and store the Drive file URL.
 */
export async function markContractSigned(token, { driveFileUrl, signedName }) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('signing_contracts')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_name: signedName,
      drive_file_url: driveFileUrl,
    })
    .eq('token', token);

  if (error) throw error;
}

/**
 * List all contracts, newest first.
 */
export async function listContracts({ type, status } = {}) {
  const supabase = getSupabase();
  let q = supabase.from('signing_contracts').select('*').order('created_at', { ascending: false });
  if (type) q = q.eq('type', type);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
