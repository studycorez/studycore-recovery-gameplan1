'use client';

import { useState } from 'react';

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function ContractsPage() {
  const [tab, setTab] = useState('tutor'); // 'tutor' | 'student'
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');
  const [sentTo, setSentTo] = useState('');

  // Tutor form
  const [tutor, setTutor] = useState({ tutorName: '', tutorEmail: '', effectiveDate: today });

  // Student form
  const [student, setStudent] = useState({
    effectiveDate: today,
    studentName: '',
    studentGrade: '',
    startingScore: '',
    targetScore: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    programWeeks: '',
    sessionsPerWeek: '1',
    sessionLengthHours: '1',
    totalHours: '',
    targetStartDate: '',
    targetTestDate: '',
    totalInvestment: '',
    paymentStructure: 'Full Upfront',
  });

  // Auto-calculate totalHours when weeks/sessions change
  function handleStudentChange(field, value) {
    setStudent(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'programWeeks' || field === 'sessionsPerWeek' || field === 'sessionLengthHours') {
        const weeks = parseFloat(field === 'programWeeks' ? value : updated.programWeeks) || 0;
        const sps = parseFloat(field === 'sessionsPerWeek' ? value : updated.sessionsPerWeek) || 0;
        const len = parseFloat(field === 'sessionLengthHours' ? value : updated.sessionLengthHours) || 0;
        updated.totalHours = weeks && sps && len ? String(weeks * sps * len) : updated.totalHours;
      }
      return updated;
    });
  }

  async function handleSend(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const isTutor = tab === 'tutor';
    const payload = isTutor
      ? {
          type: 'tutor',
          recipientName: tutor.tutorName,
          recipientEmail: tutor.tutorEmail,
          contractData: { tutorName: tutor.tutorName, effectiveDate: tutor.effectiveDate },
        }
      : {
          type: 'student',
          recipientName: student.parentName,
          recipientEmail: student.parentEmail,
          contractData: {
            ...student,
            startingScore: student.startingScore ? Number(student.startingScore) : null,
            targetScore: student.targetScore ? Number(student.targetScore) : null,
            programWeeks: student.programWeeks ? Number(student.programWeeks) : null,
            sessionsPerWeek: student.sessionsPerWeek ? Number(student.sessionsPerWeek) : null,
            sessionLengthHours: student.sessionLengthHours ? Number(student.sessionLengthHours) : null,
            totalHours: student.totalHours ? Number(student.totalHours) : null,
            totalInvestment: student.totalInvestment ? Number(student.totalInvestment) : null,
          },
        };

    try {
      const res = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSentTo(isTutor ? tutor.tutorEmail : student.parentEmail);
      setStatus('sent');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setErrorMsg('');
    setSentTo('');
    setTutor({ tutorName: '', tutorEmail: '', effectiveDate: today });
    setStudent(s => ({ ...s, studentName: '', parentName: '', parentEmail: '', parentPhone: '', startingScore: '', targetScore: '' }));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#0f172a', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>StudyCore LLC</span>
        <a href="/" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>← Back to Gameplan</a>
      </div>

      <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Send Contract</h1>
        <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>
          Send a signing link via email. The recipient signs electronically and a PDF is saved to Google Drive.
        </p>

        {status === 'sent' ? (
          <div style={card}>
            <div style={successIcon}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Contract Sent</h2>
            <p style={{ color: '#444' }}>Signing link sent to <strong>{sentTo}</strong>.</p>
            <p style={{ color: '#666', fontSize: 13 }}>Once they sign, the PDF will be automatically saved to Google Drive and logged in Supabase.</p>
            <button onClick={reset} style={{ ...btn, marginTop: 20 }}>Send Another</button>
          </div>
        ) : (
          <div style={card}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 28, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', width: 'fit-content' }}>
              {['tutor', 'student'].map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setStatus('idle'); setErrorMsg(''); }}
                  style={{
                    padding: '8px 24px',
                    border: 'none',
                    background: tab === t ? '#0f172a' : '#fff',
                    color: tab === t ? '#fff' : '#64748b',
                    fontWeight: tab === t ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {t === 'tutor' ? 'Tutor Contract' : 'Student Contract'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend}>
              {tab === 'tutor' ? (
                <TutorFields tutor={tutor} setTutor={setTutor} />
              ) : (
                <StudentFields student={student} onChange={handleStudentChange} />
              )}

              {status === 'error' && (
                <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                style={{ ...btn, marginTop: 24, opacity: status === 'sending' ? 0.6 : 1 }}
              >
                {status === 'sending' ? 'Sending…' : 'Send Signing Link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function TutorFields({ tutor, setTutor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Tutor Full Name" required>
        <input style={input} value={tutor.tutorName} onChange={e => setTutor(p => ({ ...p, tutorName: e.target.value }))} required />
      </Field>
      <Field label="Tutor Email" required>
        <input style={input} type="email" value={tutor.tutorEmail} onChange={e => setTutor(p => ({ ...p, tutorEmail: e.target.value }))} required />
      </Field>
      <Field label="Effective Date">
        <input style={input} value={tutor.effectiveDate} onChange={e => setTutor(p => ({ ...p, effectiveDate: e.target.value }))} />
      </Field>
    </div>
  );
}

function StudentFields({ student, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Student Info</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Student Name" required>
          <input style={input} value={student.studentName} onChange={e => onChange('studentName', e.target.value)} required />
        </Field>
        <Field label="Grade">
          <input style={input} value={student.studentGrade} placeholder="e.g. 10th Grade (Sophomore)" onChange={e => onChange('studentGrade', e.target.value)} />
        </Field>
        <Field label="Starting SAT Score">
          <input style={input} type="number" value={student.startingScore} onChange={e => onChange('startingScore', e.target.value)} />
        </Field>
        <Field label="Target SAT Score" required>
          <input style={input} type="number" value={student.targetScore} onChange={e => onChange('targetScore', e.target.value)} required />
        </Field>
      </div>

      <SectionLabel>Parent / Guardian</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Parent Name" required>
          <input style={input} value={student.parentName} onChange={e => onChange('parentName', e.target.value)} required />
        </Field>
        <Field label="Parent Phone">
          <input style={input} value={student.parentPhone} onChange={e => onChange('parentPhone', e.target.value)} />
        </Field>
        <Field label="Parent Email" required style={{ gridColumn: '1 / -1' }}>
          <input style={input} type="email" value={student.parentEmail} onChange={e => onChange('parentEmail', e.target.value)} required />
        </Field>
      </div>

      <SectionLabel>Program Details</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Program Weeks" required>
          <input style={input} type="number" value={student.programWeeks} onChange={e => onChange('programWeeks', e.target.value)} required />
        </Field>
        <Field label="Sessions Per Week">
          <input style={input} type="number" value={student.sessionsPerWeek} onChange={e => onChange('sessionsPerWeek', e.target.value)} />
        </Field>
        <Field label="Session Length (hours)">
          <input style={input} type="number" value={student.sessionLengthHours} onChange={e => onChange('sessionLengthHours', e.target.value)} />
        </Field>
        <Field label="Total Program Hours">
          <input style={input} type="number" value={student.totalHours} onChange={e => onChange('totalHours', e.target.value)} />
        </Field>
        <Field label="Target Start Date">
          <input style={input} value={student.targetStartDate} placeholder="e.g. September 7, 2026" onChange={e => onChange('targetStartDate', e.target.value)} />
        </Field>
        <Field label="Target Test Date">
          <input style={input} value={student.targetTestDate} placeholder="e.g. March 2027 SAT administration" onChange={e => onChange('targetTestDate', e.target.value)} />
        </Field>
        <Field label="Total Investment ($)" required>
          <input style={input} type="number" value={student.totalInvestment} onChange={e => onChange('totalInvestment', e.target.value)} required />
        </Field>
        <Field label="Payment Structure">
          <select style={input} value={student.paymentStructure} onChange={e => onChange('paymentStructure', e.target.value)}>
            <option>Full Upfront</option>
            <option>50% Upfront, 50% at Program Start</option>
            <option>Monthly Installments</option>
          </select>
        </Field>
        <Field label="Effective Date" style={{ gridColumn: '1 / -1' }}>
          <input style={input} value={student.effectiveDate} onChange={e => onChange('effectiveDate', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, required, children, style }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', margin: '8px 0 0' }}>
      {children}
    </p>
  );
}

const card = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '32px 36px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const input = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
};

const btn = {
  width: '100%',
  background: '#0f172a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '12px 0',
  fontSize: 15,
  fontWeight: 'bold',
  cursor: 'pointer',
};

const successIcon = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: '#16a34a',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 16,
};
