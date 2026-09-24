'use client';

import { useState } from 'react';
import Link from 'next/link';

const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const TABS = [
  { key: 'tutor', label: 'Tutor General Contract' },
  { key: 'tutor-student', label: 'Tutor-Student Contract' },
  { key: 'student', label: 'Student Contract' },
];

export default function ContractsPage() {
  const [tab, setTab] = useState('tutor');
  const [step, setStep] = useState('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [sentTo, setSentTo] = useState('');

  const [tutor, setTutor] = useState({ tutorName: '', tutorEmail: '', effectiveDate: todayStr });

  const [tutorStudent, setTutorStudent] = useState({
    tutorName: '', tutorEmail: '', effectiveDate: todayStr,
    studentName: '', targetScore: '', programWeeks: '',
    sessionsPerWeek: '1', sessionLengthHours: '1', totalHours: '',
    sessionDays: '', targetStartDate: '', targetEndDate: '',
  });

  const [student, setStudent] = useState({
    effectiveDate: todayStr, studentName: '', studentGrade: '',
    startingScore: '', targetScore: '',
    parentName: '', parentEmail: '', parentPhone: '',
    programWeeks: '', sessionsPerWeek: '1', sessionLengthHours: '1', totalHours: '',
    targetStartDate: '', targetTestDate: '', totalInvestment: '', paymentStructure: 'Full Upfront',
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

  function handleTutorStudentChange(field, value) {
    setTutorStudent(prev => {
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
    let payload;
    if (tab === 'tutor') {
      payload = { type: 'tutor', recipientName: tutor.tutorName, recipientEmail: tutor.tutorEmail,
        contractData: { tutorName: tutor.tutorName, effectiveDate: tutor.effectiveDate } };
    } else if (tab === 'tutor-student') {
      payload = { type: 'tutor-student', recipientName: tutorStudent.tutorName, recipientEmail: tutorStudent.tutorEmail,
        contractData: {
          ...tutorStudent,
          targetScore: tutorStudent.targetScore ? Number(tutorStudent.targetScore) : null,
          programWeeks: tutorStudent.programWeeks ? Number(tutorStudent.programWeeks) : null,
          sessionsPerWeek: tutorStudent.sessionsPerWeek ? Number(tutorStudent.sessionsPerWeek) : null,
          sessionLengthHours: tutorStudent.sessionLengthHours ? Number(tutorStudent.sessionLengthHours) : null,
          totalHours: tutorStudent.totalHours ? Number(tutorStudent.totalHours) : null,
        }};
    } else {
      payload = { type: 'student', recipientName: student.parentName, recipientEmail: student.parentEmail,
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
    }

    try {
      const res = await fetch('/api/contracts/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSentTo(tab === 'student' ? student.parentEmail : (tab === 'tutor' ? tutor.tutorEmail : tutorStudent.tutorEmail));
      setStep('sent');
    } catch (err) {
      setErrorMsg(err.message);
      setStep('error');
    }
  }

  function reset() {
    setStep('form'); setErrorMsg(''); setSentTo('');
    setTutor({ tutorName: '', tutorEmail: '', effectiveDate: todayStr });
    setTutorStudent({ tutorName: '', tutorEmail: '', effectiveDate: todayStr, studentName: '', targetScore: '', programWeeks: '', sessionsPerWeek: '1', sessionLengthHours: '1', totalHours: '', sessionDays: '', targetStartDate: '', targetEndDate: '' });
  }

  const canPreview = () => {
    if (tab === 'tutor') return tutor.tutorName && tutor.tutorEmail;
    if (tab === 'tutor-student') return tutorStudent.tutorName && tutorStudent.tutorEmail && tutorStudent.studentName && tutorStudent.targetScore;
    return student.parentName && student.parentEmail && student.studentName && student.targetScore;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
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

      <div style={{ maxWidth: 820, margin: '48px auto', padding: '0 24px' }}>

        {step === 'sent' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={successBadge}>✓</div>
              <div>
                <p style={{ fontWeight: '700', fontSize: 17, margin: 0 }}>Contract Sent</p>
                <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Signing link delivered to <strong>{sentTo}</strong></p>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: 14, marginBottom: 20 }}>Once signed, the PDF will be saved to Google Drive and the status will update on your dashboard.</p>
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
          <ContractPreview tab={tab} tutor={tutor} tutorStudent={tutorStudent} student={student}
            onBack={() => setStep('form')} onSend={handleSend} />
        )}

        {(step === 'form' || step === 'sending') && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Send Contract</h1>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Fill in the details, preview, then send a signing link via email.</p>
            </div>

            <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#e2e8f0', padding: 4, borderRadius: 8, width: 'fit-content' }}>
              {TABS.map(({ key, label }) => (
                <button key={key} onClick={() => { setTab(key); setStep('form'); }} style={{
                  padding: '8px 20px', border: 'none', borderRadius: 6,
                  background: tab === key ? '#fff' : 'transparent',
                  color: tab === key ? '#0f172a' : '#64748b',
                  fontWeight: tab === key ? '600' : '400',
                  cursor: 'pointer', fontSize: 13,
                  boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{label}</button>
              ))}
            </div>

            <div style={card}>
              {tab === 'tutor' && <TutorForm tutor={tutor} setTutor={setTutor} />}
              {tab === 'tutor-student' && <TutorStudentForm ts={tutorStudent} onChange={handleTutorStudentChange} />}
              {tab === 'student' && <StudentForm student={student} onChange={handleStudentChange} />}

              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setStep('preview')} disabled={!canPreview()} style={{ ...primaryBtn, opacity: canPreview() ? 1 : 0.4, cursor: canPreview() ? 'pointer' : 'not-allowed' }}>
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

// ─── Forms ────────────────────────────────────────────────────────────────────

function TutorForm({ tutor, setTutor }) {
  const set = f => e => setTutor(p => ({ ...p, [f]: e.target.value }));
  return (
    <div>
      <SectionLabel>Tutor Information</SectionLabel>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, marginTop: -8 }}>General onboarding contract — signed once when a tutor joins StudyCore.</p>
      <div style={grid2}>
        <Field label="Full Name" required><input style={inp} value={tutor.tutorName} onChange={set('tutorName')} required /></Field>
        <Field label="Email Address" required><input style={inp} type="email" value={tutor.tutorEmail} onChange={set('tutorEmail')} required /></Field>
        <Field label="Agreement Date"><input style={inp} value={tutor.effectiveDate} onChange={set('effectiveDate')} /></Field>
      </div>
    </div>
  );
}

function TutorStudentForm({ ts, onChange }) {
  const set = f => e => onChange(f, e.target.value);
  return (
    <div>
      <SectionLabel>Tutor Information</SectionLabel>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, marginTop: -8 }}>Per-student assignment contract — signed each time a tutor accepts a new student.</p>
      <div style={grid2}>
        <Field label="Tutor Full Name" required><input style={inp} value={ts.tutorName} onChange={set('tutorName')} required /></Field>
        <Field label="Tutor Email" required><input style={inp} type="email" value={ts.tutorEmail} onChange={set('tutorEmail')} required /></Field>
        <Field label="Agreement Date"><input style={inp} value={ts.effectiveDate} onChange={set('effectiveDate')} /></Field>
      </div>

      <SectionLabel style={{ marginTop: 24 }}>Student Assignment</SectionLabel>
      <div style={grid2}>
        <Field label="Student Name" required><input style={inp} value={ts.studentName} onChange={set('studentName')} required /></Field>
        <Field label="Target SAT Score" required><input style={inp} type="number" value={ts.targetScore} onChange={set('targetScore')} required /></Field>
        <Field label="Program Weeks"><input style={inp} type="number" value={ts.programWeeks} onChange={set('programWeeks')} /></Field>
        <Field label="Sessions Per Week"><input style={inp} type="number" value={ts.sessionsPerWeek} onChange={set('sessionsPerWeek')} /></Field>
        <Field label="Session Length (hrs)"><input style={inp} type="number" value={ts.sessionLengthHours} onChange={set('sessionLengthHours')} /></Field>
        <Field label="Total Hours"><input style={inp} type="number" value={ts.totalHours} onChange={set('totalHours')} /></Field>
        <Field label="Session Days / Times" style={{ gridColumn: '1 / -1' }}>
          <input style={inp} value={ts.sessionDays} onChange={set('sessionDays')} placeholder="e.g. Tuesdays & Thursdays at 5:00 PM PT" />
        </Field>
        <Field label="Program Start Date"><input style={inp} value={ts.targetStartDate} onChange={set('targetStartDate')} placeholder="e.g. September 7, 2026" /></Field>
        <Field label="Program End Date"><input style={inp} value={ts.targetEndDate} onChange={set('targetEndDate')} placeholder="e.g. March 1, 2027" /></Field>
      </div>
    </div>
  );
}

function StudentForm({ student, onChange }) {
  const set = f => e => onChange(f, e.target.value);
  return (
    <div>
      <SectionLabel>Student Information</SectionLabel>
      <div style={grid2}>
        <Field label="Student Name" required><input style={inp} value={student.studentName} onChange={set('studentName')} required /></Field>
        <Field label="Grade"><input style={inp} value={student.studentGrade} placeholder="e.g. 10th Grade" onChange={set('studentGrade')} /></Field>
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
        <Field label="Total Hours"><input style={inp} type="number" value={student.totalHours} onChange={e => onChange('totalHours', e.target.value)} /></Field>
        <Field label="Target Start Date"><input style={inp} value={student.targetStartDate} placeholder="e.g. September 7, 2026" onChange={set('targetStartDate')} /></Field>
        <Field label="Target Test Date"><input style={inp} value={student.targetTestDate} placeholder="e.g. March 2027 SAT" onChange={set('targetTestDate')} /></Field>
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

// ─── Preview ──────────────────────────────────────────────────────────────────

function ContractPreview({ tab, tutor, tutorStudent, student, onBack, onSend }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Contract Preview</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Review before sending the signing link.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={secondaryBtn}>← Edit</button>
          <button onClick={onSend} style={primaryBtn}>Send Signing Link</button>
        </div>
      </div>

      <div style={{ ...card, padding: 0 }}>
        <div style={{ background: '#0f172a', borderRadius: '8px 8px 0 0', padding: '28px 40px' }}>
          <p style={{ color: '#94a3b8', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 4px' }}>StudyCore LLC</p>
          <p style={{ color: '#fff', fontSize: 20, fontWeight: '700', margin: '0 0 4px' }}>
            {tab === 'tutor' ? 'Tutor Services Agreement' : tab === 'tutor-student' ? 'Tutor-Student Assignment Agreement' : 'SAT Tutoring Services Agreement'}
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
            {tab === 'tutor' && `${tutor.effectiveDate} · ${tutor.tutorName}`}
            {tab === 'tutor-student' && `${tutorStudent.effectiveDate} · ${tutorStudent.tutorName} → ${tutorStudent.studentName}`}
            {tab === 'student' && `${student.effectiveDate} · ${student.parentName}, parent of ${student.studentName}`}
          </p>
        </div>
        <div style={{ padding: '32px 40px', fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.8, color: '#1e293b' }}>
          {tab === 'tutor' && <TutorPreviewBody tutor={tutor} />}
          {tab === 'tutor-student' && <TutorStudentPreviewBody ts={tutorStudent} />}
          {tab === 'student' && <StudentPreviewBody student={student} />}
        </div>
      </div>
    </div>
  );
}

function TutorPreviewBody({ tutor }) {
  return (
    <div>
      <p>This Tutor Services Agreement is entered into as of <strong>{tutor.effectiveDate}</strong> by and between <strong>StudyCore LLC</strong> and <strong>{tutor.tutorName}</strong> ("Tutor").</p>
      <PS title="01 — Independent Contractor">
        <p>Tutor is an independent contractor, not an employee. <strong>SAT Score Accuracy:</strong> Tutor warrants their SAT score is 1550+ and all info provided is truthful. Must provide proof upon request. Misrepresentation = immediate termination without pay.</p>
      </PS>
      <PS title="02 — Services & Obligations"><ul><li>Deliver all assigned sessions per schedule</li><li>Submit session reports after every session</li><li>Respond to all messages from StudyCore and parents within 24 hours</li><li>Conduct sessions with camera on via Zoom with Fathom recording</li><li>Participate in weekly check-ins with Harshil Chilukuri</li><li>Lead office hours only when assigned by StudyCore</li><li><strong>Rescheduling:</strong> 24+ hours notice required. Less than 24hr notice = 1 strike. Max 3 reschedules per student per month with proper notice — 4th = 1 strike.</li></ul></PS>
      <PS title="03 — Strike System"><ul><li><strong>1 Strike:</strong> 10+ minutes late to a session</li><li><strong>2 Strikes:</strong> Missing a session without notice (pay forfeited for that session)</li><li><strong>3 Strikes:</strong> Termination without pay for current pay period</li></ul></PS>
      <PS title="04 — Payment & Rate Progression"><p><strong>Starting rate:</strong> $20.00/hour. <strong>Rate tiers</strong> (advances each time a student hits their target score on first SAT): $20 → $22 → $25 → $27 → $30 → $32 → $35/hr max. Pay schedule: 15th and last day of month via Zelle. Missed sessions without notice: pay forfeited. Refund clause: no pay for first 3 sessions if student discontinues; +1 strike if Tutor's fault.</p></PS>
      <PS title="05 — Tax Responsibility"><p>Tutor is solely responsible for all taxes. StudyCore will issue a 1099-NEC for earnings of $600+.</p></PS>
      <PS title="06 — Recording & Confidentiality"><p>Sessions recorded via Fathom. All student information strictly confidential. Obligation survives termination.</p></PS>
      <PS title="07 — Intellectual Property"><p>All StudyCore materials are proprietary. No reproduction or use outside of StudyCore sessions.</p></PS>
      <PS title="08 — Non-Solicitation"><p>No direct solicitation of StudyCore students for 12 months post-engagement. Violation: 6 months of Tutor's standard rate.</p></PS>
      <PS title="09 — Termination"><p><strong>Tutor-Initiated:</strong> 2 weeks written notice (4 weeks if actively assigned to a student). <strong>For Cause:</strong> Immediate termination without pay for current pay period.</p></PS>
      <PS title="10 — Non-Disparagement"><p>Tutor agrees not to make any disparaging, defamatory, or negative statements about StudyCore LLC, its founders, employees, or services to current or former students, parents, or in any public forum (including but not limited to Google, Yelp, Reddit, or social media). Tutor also agrees not to encourage any student or parent to request a chargeback, dispute a payment, or file a complaint against StudyCore. This obligation survives termination of this Agreement.</p></PS>
      <PS title="11 — Dispute Resolution"><p>Informal resolution first. If unresolved in 30 days: binding arbitration in San Ramon, CA under AAA rules. California law.</p></PS>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '2px solid #e2e8f0' }}>
        <p style={{ fontWeight: '700', fontSize: 14, color: '#0f172a', marginBottom: 20 }}>SIGNATURES</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ marginBottom: 4, height: 36, display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#0f172a' }}>Harshil Chilukuri</span>
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: 4 }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>StudyCore LLC Representative</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Date: {todayStr}</p>
            </div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: 6, height: 36 }} />
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Tutor Signature (Electronic)</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{`[Signed electronically via signing link]`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorStudentPreviewBody({ ts }) {
  return (
    <div>
      <p>This Tutor-Student Assignment Agreement is entered into as of <strong>{ts.effectiveDate}</strong> by and between <strong>StudyCore LLC</strong> and <strong>{ts.tutorName}</strong> ("Tutor"), with respect to the tutoring of <strong>{ts.studentName}</strong> ("Student").</p>
      <PS title="01 — Assignment Details">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[['Student', ts.studentName], ['Target SAT Score', ts.targetScore], ['Program Duration', ts.programWeeks ? `${ts.programWeeks} weeks` : '—'],
              ['Sessions Per Week', ts.sessionsPerWeek], ['Session Length', ts.sessionLengthHours ? `${ts.sessionLengthHours} hr` : '—'],
              ['Total Hours', ts.totalHours], ['Session Schedule', ts.sessionDays],
              ['Program Start', ts.targetStartDate], ['Program End', ts.targetEndDate]].map(([l, v]) => (
              <tr key={l}><td style={{ fontWeight: 'bold', padding: '3px 12px 3px 0', width: 160 }}>{l}</td><td style={{ padding: '3px 0', color: '#475569' }}>{v || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </PS>
      <PS title="02 — Student Commitment">
        <p>Tutor commits to remaining with {ts.studentName} for the full duration of the program ending <strong>{ts.targetEndDate || '—'}</strong>. Early departure is a serious breach of this Agreement.</p>
      </PS>
      <PS title="03 — Notice Requirements">
        <p>If Tutor needs to end this assignment, Tutor must provide a minimum of <strong>four (4) weeks written notice</strong> to StudyCore. This extended notice period (beyond the standard 2-week general notice) is required to allow StudyCore adequate time to find a qualified replacement tutor and maintain continuity for the Student.</p>
      </PS>
      <PS title="04 — Consequences of Early Departure">
        <p>If Tutor exits this assignment with less than 4 weeks written notice, the following consequences apply:</p>
        <ul>
          <li><strong>Pay Clawback:</strong> StudyCore reserves the right to withhold final payment and to formally demand repayment of the prior pay period's earnings from Tutor. This Agreement serves as legal evidence of that obligation.</li>
          <li><strong>Refund Liability:</strong> If Student or their parent requests a refund directly caused by Tutor's early departure, Tutor owes StudyCore a fee equal to two (2) weeks of Tutor's standard rate ($20.00/hour × agreed weekly hours × 2 weeks) to cover the operational cost of replacement.</li>
          <li><strong>Permanent Rehire Ban:</strong> Abandoning a student without proper notice permanently disqualifies Tutor from future work with StudyCore LLC.</li>
          <li><strong>Legal Recourse:</strong> StudyCore reserves the right to pursue any amounts owed through applicable legal channels, including small claims court in San Ramon, California.</li>
        </ul>
      </PS>
      <PS title="05 — Force Majeure Exception">
        <p>The early departure consequences in Section 04 do not apply in cases of documented medical emergency, family emergency, or other force majeure events, at StudyCore's sole discretion.</p>
      </PS>
      <PS title="06 — Payment & Performance Bonus">
        <p>Rate per General Agreement. <strong>Performance Bonus & Rate Progression:</strong> If {ts.studentName || 'Student'} hits target score of {ts.targetScore || '—'} on their first SAT after the program, Tutor receives a $200 cash bonus and advances to the next rate tier ($20→$22→$25→$27→$30→$32→$35 max). Takes effect next pay period after score confirmed. Refund clause: no pay for first 3 sessions if student discontinues; +1 strike if Tutor's fault.</p>
      </PS>
      <PS title="07 — Performance Guarantee Obligation">
        <p>If {ts.studentName || 'Student'} triggers the guarantee and Tutor is still active, Tutor continues sessions at $20/hr until student hits {ts.targetScore || '—'}. No new contract required. <strong>Performance Review:</strong> Guarantee trigger automatically initiates a session report review. If tutor-side deficiencies are found (missed reports, poor quality, failure to meet obligations), Tutor receives 1 strike. Clean review = no consequence.</p>
      </PS>
      <PS title="08 — Incorporated Terms">
        <p>All terms of Tutor's General Tutor Services Agreement remain in full effect. This Assignment Agreement supplements, and does not replace, those terms.</p>
      </PS>
      <PS title="09 — Dispute Resolution">
        <p>Governed by California law. Disputes via support@studycore.net, then binding arbitration in San Ramon, CA under AAA rules.</p>
      </PS>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '2px solid #e2e8f0' }}>
        <p style={{ fontWeight: '700', fontSize: 14, color: '#0f172a', marginBottom: 20 }}>SIGNATURES</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ marginBottom: 4, height: 36, display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#0f172a' }}>Harshil Chilukuri</span>
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: 4 }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>StudyCore LLC Representative</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Date: {todayStr}</p>
            </div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: 6, height: 36 }} />
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Tutor Signature (Electronic)</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{`[Signed electronically via signing link]`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentPreviewBody({ student }) {
  const fmt = n => n ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';
  return (
    <div>
      <p>This Agreement is entered into as of <strong>{student.effectiveDate}</strong> by and between <strong>StudyCore LLC</strong> and <strong>{student.parentName}</strong>, parent of <strong>{student.studentName}</strong>.</p>
      <PS title="01 — Program Details">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[['Student', student.studentName], ['Grade', student.studentGrade], ['Starting Score', student.startingScore], ['Target Score', student.targetScore],
              ['Parent', student.parentName], ['Email', student.parentEmail], ['Phone', student.parentPhone],
              ['Duration', student.programWeeks ? `${student.programWeeks} weeks` : '—'],
              ['Sessions/Week', student.sessionsPerWeek], ['Total Hours', student.totalHours],
              ['Start Date', student.targetStartDate], ['Test Date', student.targetTestDate]].map(([l, v]) => (
              <tr key={l}><td style={{ fontWeight: 'bold', padding: '3px 12px 3px 0', width: 140 }}>{l}</td><td style={{ padding: '3px 0', color: '#475569' }}>{v || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </PS>
      <PS title="02 — Payment"><p><strong>Total:</strong> {fmt(student.totalInvestment)} · <strong>Structure:</strong> {student.paymentStructure}. No chargebacks except where StudyCore fails to deliver.</p></PS>
      <PS title="03 — Performance Guarantee"><p>If Student completes all {student.totalHours || '—'} sessions, stays Engaged, and doesn't reach {student.targetScore || '—'} by {student.targetTestDate || '—'}, StudyCore works with Student for free until the target is achieved.</p></PS>
      <PS title="04 — Client Responsibilities"><ul><li>24+ hours notice to reschedule; max 2 reschedules/month — additional reschedules forfeit the session</li><li>100% homework, drill, and practice test completion (tracked via tutor session reports — Performance Guarantee void if below 100%)</li><li>Active engagement during all sessions</li><li><strong>SAT Registration:</strong> Register Student for {student.targetTestDate || 'the target SAT'} within 4 weeks of program start and send StudyCore confirmation. Failure to register voids the Performance Guarantee.</li></ul></PS>
      <PS title="05 — Cancellation"><p>Pause up to 2x per program (max 2 weeks each). Discontinuation: prorated refund based on sessions completed.</p></PS>
      <PS title="06 — Non-Solicitation / Recording / IP / Disputes"><p>No private solicitation of tutors for 12 months. Sessions recorded via Fathom. All materials are StudyCore IP. Disputes: arbitration in San Ramon, CA, California law.</p></PS>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '2px solid #e2e8f0' }}>
        <p style={{ fontWeight: '700', fontSize: 14, color: '#0f172a', marginBottom: 20 }}>SIGNATURES</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ marginBottom: 4, height: 36, display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#0f172a' }}>Harshil Chilukuri</span>
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: 4 }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>StudyCore LLC Representative</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Date: {todayStr}</p>
            </div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: 6, height: 36 }} />
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Parent / Guardian Signature (Electronic)</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{`[Signed electronically via signing link]`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PS({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
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
