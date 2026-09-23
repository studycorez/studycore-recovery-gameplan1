'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ContractsDashboard() {
  const [tab, setTab] = useState('tutors');
  const [contracts, setContracts] = useState([]);
  const [strikes, setStrikes] = useState({}); // { email: [strikes] }
  const [loading, setLoading] = useState(true);
  const [strikeModal, setStrikeModal] = useState(null); // { tutorName, tutorEmail }
  const [strikeForm, setStrikeForm] = useState({ reason: '', studentName: '' });
  const [strikeSubmitting, setStrikeSubmitting] = useState(false);
  const [strikeDetailModal, setStrikeDetailModal] = useState(null); // { tutorName, email }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts/list');
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);

      // Load all strikes
      const strikesRes = await fetch('/api/contracts/strikes');
      const strikesData = await strikesRes.json();
      const grouped = {};
      (strikesData || []).forEach(s => {
        if (!grouped[s.tutor_email]) grouped[s.tutor_email] = [];
        grouped[s.tutor_email].push(s);
      });
      setStrikes(grouped);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function addStrike() {
    if (!strikeForm.reason.trim()) return;
    setStrikeSubmitting(true);
    try {
      await fetch('/api/contracts/strikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorName: strikeModal.tutorName,
          tutorEmail: strikeModal.tutorEmail,
          reason: strikeForm.reason,
          studentName: strikeForm.studentName,
        }),
      });
      setStrikeModal(null);
      setStrikeForm({ reason: '', studentName: '' });
      await loadData();
    } catch (e) { console.error(e); }
    setStrikeSubmitting(false);
  }

  async function removeStrike(id) {
    if (!confirm('Remove this strike?')) return;
    await fetch(`/api/contracts/strikes?id=${id}`, { method: 'DELETE' });
    await loadData();
    if (strikeDetailModal) {
      const email = strikeDetailModal.email;
      setStrikeDetailModal(prev => ({ ...prev, strikes: (strikes[email] || []).filter(s => s.id !== id) }));
    }
  }

  const tutorContracts = contracts.filter(c => c.type === 'tutor');
  const studentContracts = contracts.filter(c => c.type === 'student');

  const signed = (arr) => arr.filter(c => c.status === 'signed').length;
  const pending = (arr) => arr.filter(c => c.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: 13, padding: '4px 10px', borderRadius: 4 }}>SC</div>
          <span style={{ fontWeight: '600', fontSize: 15, color: '#0f172a' }}>Contracts Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/contracts" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>+ Send Contract</Link>
          <Link href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Gameplan Generator</Link>
          <button onClick={loadData} style={{ fontSize: 13, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 24px' }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Tutor Contracts Sent', value: tutorContracts.length, color: '#3b82f6' },
            { label: 'Tutors Signed', value: signed(tutorContracts), color: '#16a34a' },
            { label: 'Student Contracts Sent', value: studentContracts.length, color: '#8b5cf6' },
            { label: 'Parents Signed', value: signed(studentContracts), color: '#16a34a' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: '700', color, margin: 0 }}>{loading ? '—' : value}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#e2e8f0', padding: 4, borderRadius: 8, width: 'fit-content' }}>
          {[['tutors', 'Tutors'], ['students', 'Students & Parents']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 22px', border: 'none', borderRadius: 6,
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#0f172a' : '#64748b',
              fontWeight: tab === t ? '600' : '400',
              cursor: 'pointer', fontSize: 14,
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* Tutors tab */}
        {tab === 'tutors' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', margin: 0 }}>Tutor Contracts</h2>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <span style={badge('#16a34a', '#dcfce7')}>● {signed(tutorContracts)} Signed</span>
                <span style={badge('#f59e0b', '#fef3c7')}>● {pending(tutorContracts)} Pending</span>
              </div>
            </div>

            {loading ? <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</p> : tutorContracts.length === 0 ? (
              <EmptyState text="No tutor contracts sent yet." link="/contracts" linkText="Send a tutor contract →" />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Tutor', 'Email', 'Sent', 'Status', 'Strikes', 'Actions'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tutorContracts.map(c => {
                    const tutorStrikes = strikes[c.recipient_email] || [];
                    const strikeCount = tutorStrikes.length;
                    const strikeColor = strikeCount === 0 ? '#16a34a' : strikeCount === 1 ? '#f59e0b' : strikeCount === 2 ? '#ef4444' : '#7f1d1d';
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={td}><span style={{ fontWeight: '600', color: '#0f172a' }}>{c.recipient_name}</span></td>
                        <td style={td}><span style={{ color: '#64748b', fontSize: 13 }}>{c.recipient_email}</span></td>
                        <td style={td}><span style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(c.created_at).toLocaleDateString()}</span></td>
                        <td style={td}>
                          <span style={c.status === 'signed'
                            ? badge('#16a34a', '#dcfce7')
                            : badge('#f59e0b', '#fef3c7')}>
                            {c.status === 'signed' ? '✓ Signed' : '○ Pending'}
                          </span>
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => setStrikeDetailModal({ tutorName: c.recipient_name, email: c.recipient_email, strikes: tutorStrikes })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: 15, color: strikeColor }}
                          >
                            {strikeCount} {strikeCount === 1 ? 'strike' : 'strikes'}
                          </button>
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setStrikeModal({ tutorName: c.recipient_name, tutorEmail: c.recipient_email })}
                              style={actionBtn('#ef4444')}
                            >+ Strike</button>
                            {c.drive_file_url && (
                              <a href={c.drive_file_url} target="_blank" rel="noopener noreferrer" style={actionBtn('#3b82f6')}>View PDF</a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Students tab */}
        {tab === 'students' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', margin: 0 }}>Student / Parent Contracts</h2>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <span style={badge('#16a34a', '#dcfce7')}>● {signed(studentContracts)} Signed</span>
                <span style={badge('#f59e0b', '#fef3c7')}>● {pending(studentContracts)} Pending</span>
              </div>
            </div>

            {loading ? <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</p> : studentContracts.length === 0 ? (
              <EmptyState text="No student contracts sent yet." link="/contracts" linkText="Send a student contract →" />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Student', 'Parent', 'Email', 'Program', 'Sent', 'Status', 'Actions'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentContracts.map(c => {
                    const d = c.contract_data || {};
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={td}><span style={{ fontWeight: '600', color: '#0f172a' }}>{d.studentName || '—'}</span></td>
                        <td style={td}><span style={{ color: '#475569', fontSize: 13 }}>{c.recipient_name}</span></td>
                        <td style={td}><span style={{ color: '#64748b', fontSize: 13 }}>{c.recipient_email}</span></td>
                        <td style={td}><span style={{ color: '#475569', fontSize: 13 }}>{d.programWeeks ? `${d.programWeeks}w · ${d.totalHours}h · ${d.targetScore}` : '—'}</span></td>
                        <td style={td}><span style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(c.created_at).toLocaleDateString()}</span></td>
                        <td style={td}>
                          <span style={c.status === 'signed' ? badge('#16a34a', '#dcfce7') : badge('#f59e0b', '#fef3c7')}>
                            {c.status === 'signed' ? '✓ Signed' : '○ Pending'}
                          </span>
                        </td>
                        <td style={td}>
                          {c.drive_file_url
                            ? <a href={c.drive_file_url} target="_blank" rel="noopener noreferrer" style={actionBtn('#3b82f6')}>View PDF</a>
                            : <span style={{ color: '#94a3b8', fontSize: 12 }}>Unsigned</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add Strike Modal */}
      {strikeModal && (
        <Modal onClose={() => { setStrikeModal(null); setStrikeForm({ reason: '', studentName: '' }); }}>
          <h3 style={{ fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>Add Strike</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Issuing a strike to <strong>{strikeModal.tutorName}</strong></p>
          <Field label="Reason" required>
            <select style={inp} value={strikeForm.reason} onChange={e => setStrikeForm(p => ({ ...p, reason: e.target.value }))}>
              <option value="">Select a reason…</option>
              <option value="Late to session (10+ minutes)">Late to session (10+ minutes)</option>
              <option value="Missed session without notice">Missed session without notice</option>
              <option value="Unprofessional conduct with parent">Unprofessional conduct with parent</option>
              <option value="Failed to submit session report">Failed to submit session report</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Related Student (optional)" style={{ marginTop: 14 }}>
            <input style={inp} value={strikeForm.studentName} onChange={e => setStrikeForm(p => ({ ...p, studentName: e.target.value }))} placeholder="Student name" />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={addStrike} disabled={!strikeForm.reason || strikeSubmitting} style={{ ...primaryBtn, opacity: !strikeForm.reason ? 0.4 : 1 }}>
              {strikeSubmitting ? 'Saving…' : 'Issue Strike'}
            </button>
            <button onClick={() => { setStrikeModal(null); setStrikeForm({ reason: '', studentName: '' }); }} style={secondaryBtn}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Strike Detail Modal */}
      {strikeDetailModal && (
        <Modal onClose={() => setStrikeDetailModal(null)}>
          <h3 style={{ fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>Strike History</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>{strikeDetailModal.tutorName}</p>
          {(strikes[strikeDetailModal.email] || []).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No strikes on record.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(strikes[strikeDetailModal.email] || []).map(s => (
                <div key={s.id} style={{ background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 6, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: '700', fontSize: 13, color: '#92400e', margin: '0 0 2px' }}>Strike #{s.strike_num}</p>
                    <p style={{ fontSize: 13, color: '#475569', margin: '0 0 2px' }}>{s.reason}</p>
                    {s.student_name && <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Student: {s.student_name}</p>}
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => removeStrike(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setStrikeDetailModal(null)} style={{ ...secondaryBtn, marginTop: 20, width: '100%' }}>Close</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 440, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text, link, linkText }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>{text}</p>
      <Link href={link} style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>{linkText}</Link>
    </div>
  );
}

function Field({ label, required, children, style }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const th = { textAlign: 'left', fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, padding: '8px 12px 12px' };
const td = { padding: '14px 12px', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', outline: 'none', background: '#fafafa', color: '#0f172a' };
const primaryBtn = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 20px', fontSize: 14, fontWeight: '600', cursor: 'pointer' };
const secondaryBtn = { background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, padding: '9px 20px', fontSize: 14, fontWeight: '600', cursor: 'pointer' };
const badge = (color, bg) => ({ background: bg, color, padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: '600' });
const actionBtn = (color) => ({ background: color + '10', color, border: `1px solid ${color}30`, borderRadius: 5, padding: '4px 10px', fontSize: 12, fontWeight: '600', cursor: 'pointer', textDecoration: 'none' });
