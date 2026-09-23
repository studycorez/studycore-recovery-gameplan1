'use client';

import { useState } from 'react';
import Link from 'next/link';

const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function ContractsPage() {
  const [tab, setTab] = useState('tutor');
  const [step, setStep] = useState('form'); // form | preview | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');
  const [sentTo, setSentTo] = useState('');

  const [tutor, setTutor] = useState({
    tutorName: '', tutorEmail: '', effectiveDate: todayStr,
    assignedStudents: '',
  });

  const [student, setStudent] = useState({
    effectiveDate: todayStr,
    studentName: '', studentGrade: '',
    startingScore: '', targetScore: '',
    parentName: '', parentEmail: '', parentPhone: '',
    programWeeks: '', sessionsPerWeek: '1', sessionLengthHours: '1', totalHours: '',
    targetStartDate: '', targetTestDate: '',
    totalInvestment: '', paymentStructure: 'Full Upfront',
  });

  function handleStudentChange(field, value) {
    setStudent(prev => {
      const updated = { ...prev, [field]: value };
      if (['programWeeks', 'sessionsPerWeek', 'sessionLengthHours'].includes(field)) {
        const w = parseFloat(field === 'programWeeks' ? value : updated.programWeeks) || 0;
        const s = parseFloat(field === 'sessionsPerWeek' ? value : updated.sessionsPerWeek) || 0;
        const l = parseFloat(field === 'sessionLengthHours' ? value : updated.sessionLengthHours) || 0;
        if (w && s && l) updated.totalHours = String(w * s * l);
      }
      return updated;
    });
  }

  async function handleSend() {
    setStep('sending');
    const isTutor = tab === 'tutor';
    const payload = isTutor
      ? { type: 'tutor', recipientName: tutor.tutorName, recipientEmail: tutor.tutorEmail,
          contractData: { tutorName: tutor.tutorName, effectiveDate: tutor.effectiveDate, assignedStudents: tutor.assignedStudents } }
      : { type: 'student', recipientName: student.parentName, recipientEmail: student.parentEmail,
          contractData: {
            ...student,
            startingScore: student.startingScore ? Number(student.startingScore) : null,
            targetScore: student.targetScore ? Number(student.targetScore) : null,
            programWeeks: student.programWeeks ? Number(student.programWeeks) : null,
            sessionsPerWeek: student.sessionsPerWeek ? Number(student.sessionsPerWeek) : null,
            sessionLengthHours: student.sessionLengthHours ? Number(student.sessionLengthHours) : null,
            totalHours: student.totalHours ? Number(student.totalHours) : null,
            totalInvestment: student.totalInvestment ? Number(student.totalInvestment) : null,
          }};
    try {
      const res = await fetch('/api/contracts/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSentTo(isTutor ? tutor.tutorEmail : student.parentEmail);
      setStep('sent');
    } catch (err) {
      setErrorMsg(err.message);
      setStep('error');
    }
  }

  function reset() {
    setStep('form'); setErrorMsg(''); setSentTo('');
    setTutor({ tutorName: '', tutorEmail: '', effectiveDate: todayStr, assignedStudents: '' });
    setStudent(s => ({ ...s, studentName: '', parentName: '', parentEmail: '', parentPhone: '', startingScore: '', targetScore: '', programWeeks: '', totalHours: '', targetStartDate: '', targetTestDate: '', totalInvestment: '' }));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Top nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: 13, padding: '4px 10px', borderRadius: 4 }}>SC</div>
          <span style={{ fontWeight: '600', fontSize: 15, color: '#0f172a' }}>StudyCore Contracts</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/contracts/dashboard" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>Dashboard →</Link>
          <Link href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Gameplan Generator</Link>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '48px auto', padding: '0 24px' }}>

        {step === 'sent' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={successBadge}>✓</div>
              <div>
                <p style={{ fontWeight: '700', fontSize: 17, margin: 0 }}>Contract Sent</p>
                <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Signing link delivered to <strong>{sentTo}</strong></p>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: 14, marginBottom: 20 }}>
              Once signed, the PDF will be saved to Google Drive and the status will update on your dashboard.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={reset} style={primaryBtn}>Send Another Contract</button>
              <Link href="/contracts/dashboard" style={{ ...secondaryBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>View Dashboard</Link>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div style={{ ...card, borderLeft: '4px solid #ef4444' }}>
            <p style={{ fontWeight: '700', color: '#dc2626', marginBottom: 8 }}>Error sending contract</p>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>
            <button onClick={() => setStep('form')} style={primaryBtn}>Try Again</button>
          </div>
        )}

        {step === 'preview' && (
          <ContractPreview
            tab={tab} tutor={tutor} student={student}
            onBack={() => setStep('form')}
            onSend={handleSend}
          />
        )}

        {(step === 'form' || step === 'sending') && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Send Contract</h1>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Fill in the details below, preview the contract, then send a signing link via email.</p>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#e2e8f0', padding: 4, borderRadius: 8, width: 'fit-content' }}>
              {[['tutor', 'Tutor Contract'], ['student', 'Student Contract']].map(([t, label]) => (
                <button key={t} onClick={() => { setTab(t); setStep('form'); }} style={{
                  padding: '8px 22px', border: 'none', borderRadius: 6,
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#0f172a' : '#64748b',
                  fontWeight: tab === t ? '600' : '400',
                  cursor: 'pointer', fontSize: 14,
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            <div style={card}>
              {tab === 'tutor'
                ? <TutorForm tutor={tutor} setTutor={setTutor} />
                : <StudentForm student={student} onChange={handleStudentChange} />}

              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setStep('preview')}
                  disabled={tab === 'tutor' ? !tutor.tutorName || !tutor.tutorEmail : !student.parentName || !student.parentEmail || !student.studentName || !student.targetScore}
                  style={{ ...primaryBtn, opacity: (tab === 'tutor' ? !tutor.tutorName || !tutor.tutorEmail : !student.parentName || !student.parentEmail) ? 0.4 : 1 }}
                >
                  Preview Contract →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tutor Form ───────────────────────────────────────────────────────────────

function TutorForm({ tutor, setTutor }) {
  const set = (f) => (e) => setTutor(p => ({ ...p, [f]: e.target.value }));
  return (
    <div>
      <SectionLabel>Tutor Information</SectionLabel>
      <div style={grid2}>
        <Field label="Full Name" required><input style={inp} value={tutor.tutorName} onChange={set('tutorName')} required /></Field>
        <Field label="Email Address" required><input style={inp} type="email" value={tutor.tutorEmail} onChange={set('tutorEmail')} required /></Field>
        <Field label="Agreement Date"><input style={inp} value={tutor.effectiveDate} onChange={set('effectiveDate')} /></Field>
      </div>

      <SectionLabel style={{ marginTop: 24 }}>Assigned Students</SectionLabel>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>List the student(s) this tutor is committed to for the duration of their program. Separate multiple names with commas.</p>
      <Field label="Student Name(s)">
        <input style={inp} value={tutor.assignedStudents} onChange={set('assignedStudents')} placeholder="e.g. Aryan Mani, John Smith" />
      </Field>
    </div>
  );
}

// ─── Student Form ─────────────────────────────────────────────────────────────

function StudentForm({ student, onChange }) {
  const set = (f) => (e) => onChange(f, e.target.value);
  return (
    <div>
      <SectionLabel>Student Information</SectionLabel>
      <div style={grid2}>
        <Field label="Student Name" required><input style={inp} value={student.studentName} onChange={set('studentName')} required /></Field>
        <Field label="Grade"><input style={inp} value={student.studentGrade} placeholder="e.g. 10th Grade (Sophomore)" onChange={set('studentGrade')} /></Field>
        <Field label="Starting SAT Score"><input style={inp} type="number" value={student.startingScore} onChange={set('startingScore')} /></Field>
        <Field label="Target SAT Score" required><input style={inp} type="number" value={student.targetScore} onChange={set('targetScore')} required /></Field>
      </div>

      <SectionLabel style={{ marginTop: 24 }}>Parent / Guardian</SectionLabel>
      <div style={grid2}>
        <Field label="Parent Name" required><input style={inp} value={student.parentName} onChange={set('parentName')} required /></Field>
        <Field label="Parent Phone"><input style={inp} value={student.parentPhone} onChange={set('parentPhone')} /></Field>
        <Field label="Parent Email" required style={{ gridColumn: '1 / -1' }}><input style={inp} type="email" value={student.parentEmail} onChange={set('parentEmail')} required /></Field>
      </div>

      <SectionLabel style={{ marginTop: 24 }}>Program Details</SectionLabel>
      <div style={grid2}>
        <Field label="Program Weeks" required><input style={inp} type="number" value={student.programWeeks} onChange={set('programWeeks')} required /></Field>
        <Field label="Sessions Per Week"><input style={inp} type="number" value={student.sessionsPerWeek} onChange={set('sessionsPerWeek')} /></Field>
        <Field label="Session Length (hrs)"><input style={inp} type="number" value={student.sessionLengthHours} onChange={set('sessionLengthHours')} /></Field>
        <Field label="Total Program Hours"><input style={inp} type="number" value={student.totalHours} onChange={(e) => onChange('totalHours', e.target.value)} /></Field>
        <Field label="Target Start Date"><input style={inp} value={student.targetStartDate} placeholder="e.g. September 7, 2026" onChange={set('targetStartDate')} /></Field>
        <Field label="Target Test Date"><input style={inp} value={student.targetTestDate} placeholder="e.g. March 2027 SAT administration" onChange={set('targetTestDate')} /></Field>
        <Field label="Total Investment ($)" required><input style={inp} type="number" value={student.totalInvestment} onChange={set('totalInvestment')} required /></Field>
        <Field label="Payment Structure">
          <select style={inp} value={student.paymentStructure} onChange={set('paymentStructure')}>
            <option>Full Upfront</option>
            <option>50% Upfront, 50% at Program Start</option>
            <option>Monthly Installments</option>
          </select>
        </Field>
        <Field label="Agreement Date" style={{ gridColumn: '1 / -1' }}><input style={inp} value={student.effectiveDate} onChange={set('effectiveDate')} /></Field>
      </div>
    </div>
  );
}

// ─── Contract Preview ─────────────────────────────────────────────────────────

function ContractPreview({ tab, tutor, student, onBack, onSend }) {
  const isTutor = tab === 'tutor';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Contract Preview</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Review the contract before sending the signing link.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={secondaryBtn}>← Edit</button>
          <button onClick={onSend} style={primaryBtn}>Send Signing Link</button>
        </div>
      </div>

      <div style={{ ...card, padding: 0 }}>
        {/* Contract header */}
        <div style={{ background: '#0f172a', borderRadius: '8px 8px 0 0', padding: '28px 40px' }}>
          <p style={{ color: '#94a3b8', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 4px' }}>StudyCore LLC</p>
          <p style={{ color: '#fff', fontSize: 20, fontWeight: '700', margin: '0 0 4px' }}>
            {isTutor ? 'Tutor Services Agreement' : 'SAT Tutoring Services Agreement'}
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
            {isTutor
              ? `${tutor.effectiveDate} · ${tutor.tutorName}`
              : `${student.effectiveDate} · ${student.parentName}, parent of ${student.studentName}`}
          </p>
        </div>

        <div style={{ padding: '32px 40px', fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.8, color: '#1e293b' }}>
          {isTutor ? <TutorPreviewBody tutor={tutor} /> : <StudentPreviewBody student={student} />}
        </div>
      </div>
    </div>
  );
}

function TutorPreviewBody({ tutor }) {
  const students = tutor.assignedStudents ? tutor.assignedStudents.split(',').map(s => s.trim()).filter(Boolean) : [];
  return (
    <div>
      <p>This Tutor Services Agreement is entered into as of <strong>{tutor.effectiveDate}</strong> by and between <strong>StudyCore LLC</strong>, a California limited liability company, and <strong>{tutor.tutorName}</strong> ("Tutor").</p>

      {students.length > 0 && (
        <PreviewSection title="Assigned Students">
          <p>Tutor commits to delivering services for the following student(s) for the duration of each student's program:</p>
          <ul>{students.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </PreviewSection>
      )}

      <PreviewSection title="01 — Independent Contractor">
        <p>Tutor is an independent contractor, not an employee. Tutor must have a verified SAT score of 1550 or higher.</p>
      </PreviewSection>
      <PreviewSection title="02 — Services & Obligations">
        <ul>
          <li>Deliver all assigned 1-on-1 sessions per schedule</li>
          <li>Lead office hours only when assigned by StudyCore</li>
          <li>Submit a session report after every session</li>
          <li>Maintain professional communication with parents and StudyCore</li>
          <li>Participate in weekly check-ins with Harshil Chilukuri</li>
          <li>Monitor and report student progress proactively</li>
        </ul>
      </PreviewSection>
      <PreviewSection title="03 — Student Commitment">
        <p>Once assigned a student, Tutor must remain with that student for the full program duration. Early departure without StudyCore approval is a terminable offense.</p>
      </PreviewSection>
      <PreviewSection title="04 — Strike System">
        <ul>
          <li><strong>1 Strike:</strong> 10+ minutes late to a session</li>
          <li><strong>2 Strikes:</strong> Missing a session without notice (pay forfeited for that session)</li>
          <li><strong>3 Strikes:</strong> Termination without pay for current pay period</li>
        </ul>
      </PreviewSection>
      <PreviewSection title="05 — Payment">
        <p><strong>$20.00/hour</strong> · Paid on the 15th and last day of each month via Zelle · Same rate for sessions and office hours.</p>
        <p>If a student refunds within their first 3 sessions, Tutor is not paid for those sessions. If the refund is Tutor's fault, Tutor receives an additional strike.</p>
      </PreviewSection>
      <PreviewSection title="06 — Tax Responsibility">
        <p>Tutor is responsible for all taxes on income earned. StudyCore will issue a 1099-NEC for earnings of $600+.</p>
      </PreviewSection>
      <PreviewSection title="07 — Recording & Confidentiality">
        <p>All sessions recorded via Fathom. Student information is strictly confidential. This obligation survives termination.</p>
      </PreviewSection>
      <PreviewSection title="08 — Intellectual Property">
        <p>All StudyCore materials are proprietary. Tutor may not reproduce or use them outside of StudyCore sessions.</p>
      </PreviewSection>
      <PreviewSection title="09 — Non-Solicitation">
        <p>No direct solicitation of StudyCore students for 12 months post-engagement. Violation: 6 months of Tutor's standard rate.</p>
      </PreviewSection>
      <PreviewSection title="10 — Termination">
        <p><strong>Tutor-Initiated:</strong> 2 weeks written notice required.</p>
        <p><strong>StudyCore-Initiated:</strong> Immediate for cause (3 strikes, misconduct, confidentiality breach, student abandonment). No pay for current period.</p>
      </PreviewSection>
      <PreviewSection title="11 — Dispute Resolution">
        <p>Informal resolution first via support@studycore.net. If unresolved in 30 days: binding arbitration in San Ramon, CA under AAA rules. Governed by California law.</p>
      </PreviewSection>
    </div>
  );
}

function StudentPreviewBody({ student }) {
  const fmt = (n) => n ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';
  return (
    <div>
      <p>This Agreement is entered into as of <strong>{student.effectiveDate}</strong> by and between <strong>StudyCore LLC</strong> and <strong>{student.parentName}</strong> ("Client"), parent or legal guardian of <strong>{student.studentName}</strong>.</p>

      <PreviewSection title="01 — Parties & Program Details">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[['Student', student.studentName], ['Grade', student.studentGrade], ['Starting Score', student.startingScore], ['Target Score', student.targetScore],
              ['Parent', student.parentName], ['Email', student.parentEmail], ['Phone', student.parentPhone]].map(([l, v]) => (
              <tr key={l}><td style={{ fontWeight: 'bold', padding: '3px 12px 3px 0', width: 140, verticalAlign: 'top' }}>{l}</td><td style={{ padding: '3px 0' }}>{v || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </PreviewSection>
      <PreviewSection title="02 — Program Scope">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[['Duration', student.programWeeks ? `${student.programWeeks} weeks` : '—'],
              ['Sessions/Week', student.sessionsPerWeek], ['Session Length', student.sessionLengthHours ? `${student.sessionLengthHours} hr` : '—'],
              ['Total Hours', student.totalHours], ['Start Date', student.targetStartDate], ['Test Date', student.targetTestDate]].map(([l, v]) => (
              <tr key={l}><td style={{ fontWeight: 'bold', padding: '3px 12px 3px 0', width: 140, verticalAlign: 'top' }}>{l}</td><td style={{ padding: '3px 0' }}>{v || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </PreviewSection>
      <PreviewSection title="03 — Payment">
        <p><strong>Total:</strong> {fmt(student.totalInvestment)} · <strong>Structure:</strong> {student.paymentStructure}</p>
        <p>No chargebacks except where StudyCore fails to deliver. Unauthorized chargebacks will be contested using this signed Agreement.</p>
      </PreviewSection>
      <PreviewSection title="04 — Performance Guarantee">
        <p>If Student completes all {student.totalHours || '—'} sessions and remains Engaged but does not reach {student.targetScore || '—'} by {student.targetTestDate || '—'}, StudyCore will continue at no cost until the target is achieved.</p>
      </PreviewSection>
      <PreviewSection title="05 — Client Responsibilities">
        <ul>
          <li>24-hour notice to reschedule; max 2 reschedules/month</li>
          <li>100% homework, drill, and practice test completion</li>
          <li>Active engagement during all sessions</li>
          <li>Reliable device and internet for online sessions</li>
        </ul>
      </PreviewSection>
      <PreviewSection title="06 — Cancellation & Refund">
        <p>Pause up to 2x per program (max 2 weeks each). Discontinuation: prorated refund based on sessions completed.</p>
      </PreviewSection>
      <PreviewSection title="07 — Non-Solicitation / Recording / IP / Disputes">
        <p>No private solicitation of StudyCore tutors for 12 months. Sessions recorded via Fathom. All materials are StudyCore IP. Disputes: arbitration in San Ramon, CA under California law.</p>
      </PreviewSection>
    </div>
  );
}

function PreviewSection({ title, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <p style={{ fontWeight: '700', fontSize: 13, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 10 }}>{title}</p>
      {children}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

function SectionLabel({ children, style }) {
  return <p style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 14px', ...style }}>{children}</p>;
}

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '32px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', outline: 'none', background: '#fafafa', color: '#0f172a' };
const primaryBtn = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontSize: 14, fontWeight: '600', cursor: 'pointer' };
const secondaryBtn = { background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 22px', fontSize: 14, fontWeight: '600', cursor: 'pointer' };
const successBadge = { width: 40, height: 40, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', flexShrink: 0 };
