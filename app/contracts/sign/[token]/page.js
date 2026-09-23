'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SignContractPage() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | ready | already_signed | signing | success | error
  const [contractInfo, setContractInfo] = useState(null);
  const [signedName, setSignedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [driveUrl, setDriveUrl] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/contracts/sign?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.alreadySigned) {
          setState('already_signed');
        } else if (data.error) {
          setErrorMsg(data.error);
          setState('error');
        } else {
          setContractInfo(data);
          setState('ready');
        }
      })
      .catch(() => {
        setErrorMsg('Failed to load contract. Please try again.');
        setState('error');
      });
  }, [token]);

  async function handleSign(e) {
    e.preventDefault();
    if (!signedName.trim() || !agreed) return;
    setState('signing');
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signedName: signedName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signing failed');
      setDriveUrl(data.driveFileUrl);
      setState('success');
    } catch (err) {
      setErrorMsg(err.message);
      setState('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#0f172a', padding: '16px 32px' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>StudyCore LLC</span>
      </div>

      <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
        {state === 'loading' && (
          <div style={card}>
            <p style={{ color: '#666', textAlign: 'center' }}>Loading contract…</p>
          </div>
        )}

        {state === 'error' && (
          <div style={card}>
            <h2 style={heading}>Unable to Load Contract</h2>
            <p style={{ color: '#dc2626' }}>{errorMsg}</p>
            <p style={{ color: '#666', fontSize: 14 }}>
              Please contact <a href="mailto:support@studycore.net" style={{ color: '#0f172a' }}>support@studycore.net</a> for assistance.
            </p>
          </div>
        )}

        {state === 'already_signed' && (
          <div style={card}>
            <div style={successIcon}>✓</div>
            <h2 style={heading}>Already Signed</h2>
            <p style={{ color: '#666' }}>This contract has already been signed. No further action is needed.</p>
            <p style={{ color: '#666', fontSize: 14 }}>
              Questions? Contact <a href="mailto:support@studycore.net" style={{ color: '#0f172a' }}>support@studycore.net</a>.
            </p>
          </div>
        )}

        {state === 'success' && (
          <div style={card}>
            <div style={successIcon}>✓</div>
            <h2 style={heading}>Agreement Signed</h2>
            <p style={{ color: '#444' }}>
              Thank you, <strong>{signedName}</strong>. Your signed agreement has been recorded.
            </p>
            {driveUrl && (
              <p style={{ marginTop: 16 }}>
                <a href={driveUrl} target="_blank" rel="noopener noreferrer" style={linkBtn}>
                  View Signed Copy
                </a>
              </p>
            )}
            <p style={{ color: '#666', fontSize: 13, marginTop: 16 }}>
              A copy is saved on file. Contact <a href="mailto:support@studycore.net" style={{ color: '#0f172a' }}>support@studycore.net</a> with any questions.
            </p>
          </div>
        )}

        {(state === 'ready' || state === 'signing') && contractInfo && (
          <>
            <div style={card}>
              <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>
                {contractInfo.type === 'tutor' ? 'Tutor Services Agreement' : 'SAT Tutoring Services Agreement'}
              </h1>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
                StudyCore LLC · Please read the full agreement below before signing.
              </p>

              {/* Contract body */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '24px 28px',
                maxHeight: 520,
                overflowY: 'auto',
                fontSize: 13,
                lineHeight: 1.7,
                color: '#1e293b',
              }}>
                {contractInfo.type === 'tutor'
                  ? <TutorContractText data={contractInfo.contractData} recipientName={contractInfo.recipientName} />
                  : <StudentContractText data={contractInfo.contractData} />
                }
              </div>
            </div>

            {/* Signature form */}
            <div style={{ ...card, marginTop: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Sign this Agreement</h2>
              <form onSubmit={handleSign}>
                <label style={label}>
                  Full Legal Name
                  <input
                    type="text"
                    value={signedName}
                    onChange={e => setSignedName(e.target.value)}
                    placeholder={contractInfo.type === 'tutor' ? 'Your full name' : contractInfo.contractData?.parentName || 'Parent/Guardian full name'}
                    required
                    style={input}
                    disabled={state === 'signing'}
                  />
                </label>

                <label style={{ ...label, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16 }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    disabled={state === 'signing'}
                    style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                    I have read and agree to all terms of this Agreement. I understand that my typed name above constitutes a legally binding electronic signature under the ESIGN Act.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!signedName.trim() || !agreed || state === 'signing'}
                  style={{
                    ...signBtn,
                    opacity: (!signedName.trim() || !agreed || state === 'signing') ? 0.5 : 1,
                    cursor: (!signedName.trim() || !agreed || state === 'signing') ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state === 'signing' ? 'Signing…' : 'Sign Agreement'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: '#94a3b8' }}>
        StudyCore LLC · San Ramon, California · support@studycore.net · studycore.net
      </div>
    </div>
  );
}

// ─── Inline contract text renderers ───────────────────────────────────────────

function TutorContractText({ data, recipientName }) {
  const name = recipientName || data?.tutorName || '[Tutor Name]';
  const date = data?.effectiveDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div>
      <p>This Tutor Services Agreement is entered into as of <strong>{date}</strong> by and between <strong>StudyCore LLC</strong>, a California limited liability company, and <strong>{name}</strong> ("Tutor").</p>

      <Section title="01 — INDEPENDENT CONTRACTOR RELATIONSHIP">
        <p>Tutor is engaged as an independent contractor, not an employee. Nothing in this Agreement creates an employment relationship. Tutor is not entitled to employee benefits of any kind.</p>
        <p>Tutor represents they have achieved a verified SAT score of <strong>1550 or higher</strong> and agrees to provide proof upon request.</p>
      </Section>

      <Section title="02 — SERVICES & OBLIGATIONS">
        <ul>
          <li>Deliver all assigned 1-on-1 tutoring sessions per each student's agreed schedule</li>
          <li>Lead office hours only when explicitly assigned by StudyCore</li>
          <li>Submit a session report after every session</li>
          <li>Maintain professional, timely communication with parents and the StudyCore team</li>
          <li>Be available within the agreed-upon availability window close to session times</li>
          <li>Monitor student progress proactively and report concerns immediately</li>
          <li>Participate in weekly check-ins with Harshil Chilukuri</li>
        </ul>
      </Section>

      <Section title="03 — STUDENT COMMITMENT">
        <p>Once Tutor accepts a student assignment, Tutor commits to remaining with that student for the full duration of the student's program. Early departure without prior written approval from StudyCore is a terminable offense and may affect final compensation. Exceptions may be made at StudyCore's sole discretion for force majeure or StudyCore-initiated reassignment.</p>
      </Section>

      <Section title="04 — PERFORMANCE STANDARDS & STRIKE SYSTEM">
        <ul>
          <li><strong>1 Strike:</strong> Arriving 10+ minutes late to a scheduled session</li>
          <li><strong>2 Strikes:</strong> Missing a scheduled session without prior notice (pay forfeited for that session)</li>
          <li><strong>3 Strikes:</strong> Termination without pay for the current pay period</li>
        </ul>
        <p>Strikes are tracked and issued at StudyCore's discretion. Tutor will be notified in writing each time.</p>
      </Section>

      <Section title="05 — PAYMENT & COMPENSATION">
        <p><strong>Rate:</strong> $20.00/hour for 1-on-1 sessions and office hours.</p>
        <p><strong>Pay Schedule:</strong> 15th and last day of each month via Zelle.</p>
        <p><strong>Forfeited Sessions:</strong> No pay for sessions Tutor misses without notice.</p>
        <p><strong>Refund Clause:</strong> If a student discontinues within their first 3 sessions, Tutor will not receive payment for those sessions. If the discontinuation is due to Tutor's conduct, Tutor also receives one strike.</p>
        <p>StudyCore may adjust Tutor's rate with 30 days written notice.</p>
      </Section>

      <Section title="06 — TAX RESPONSIBILITY">
        <p>Tutor is solely responsible for all federal, state, and local taxes on income earned under this Agreement, including self-employment tax. StudyCore will issue a 1099-NEC for any calendar year in which Tutor earns $600+.</p>
      </Section>

      <Section title="07 — SESSION RECORDING & CONFIDENTIALITY">
        <p>All sessions are recorded via Fathom. By signing, Tutor consents to recording. Recordings are confidential — accessible only to the student, parent, and StudyCore team.</p>
        <p>Tutor must keep all student information strictly confidential. This obligation survives termination.</p>
      </Section>

      <Section title="08 — INTELLECTUAL PROPERTY">
        <p>All StudyCore materials are proprietary to StudyCore LLC. Tutor may not reproduce, distribute, resell, or use them outside of StudyCore-assigned sessions.</p>
      </Section>

      <Section title="09 — NON-SOLICITATION">
        <p>Tutor may not directly hire, solicit, or engage any StudyCore student for private tutoring during and for 12 months following their engagement with StudyCore. Violation results in a fee equal to 6 months of Tutor's standard StudyCore rate.</p>
      </Section>

      <Section title="10 — TERMINATION">
        <p><strong>Tutor-Initiated:</strong> 2 weeks written notice required. Tutor is paid for sessions during the notice period.</p>
        <p><strong>StudyCore-Initiated for Cause:</strong> Immediate termination without pay for the current pay period for: 3-strike threshold reached, unprofessional conduct, confidentiality breach, abandonment of a student, or other serious misconduct.</p>
        <p>Upon termination, Tutor must immediately cease use of all StudyCore materials.</p>
      </Section>

      <Section title="11 — LIMITATION OF LIABILITY">
        <p>StudyCore LLC's total liability to Tutor shall not exceed the total amount paid in the 60 days preceding the claim. StudyCore is not liable for indirect or consequential damages.</p>
      </Section>

      <Section title="12 — DISPUTE RESOLUTION">
        <p>Disputes shall first be attempted informally via support@studycore.net. If unresolved within 30 days: binding arbitration in San Ramon, California under AAA rules. Governed by California law.</p>
      </Section>

      <Section title="13 — ENTIRE AGREEMENT">
        <p>This Agreement supersedes all prior discussions. Modifications must be in writing. If any provision is unenforceable, remaining provisions remain in full force.</p>
      </Section>
    </div>
  );
}

function StudentContractText({ data }) {
  const d = data || {};
  const fmt = (n) => n ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';
  return (
    <div>
      <p>This SAT Tutoring Services Agreement is entered into as of <strong>{d.effectiveDate || '—'}</strong> by and between <strong>StudyCore LLC</strong> and <strong>{d.parentName || '[Parent Name]'}</strong> ("Client"), parent or legal guardian of <strong>{d.studentName || '[Student Name]'}</strong>.</p>

      <Section title="01 — PARTIES & PROGRAM DETAILS">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['Student Name', d.studentName],
              ['Grade', d.studentGrade],
              ['Starting SAT Score', d.startingScore],
              ['Target SAT Score', d.targetScore],
              ['Parent Name', d.parentName],
              ['Parent Email', d.parentEmail],
              ['Parent Phone', d.parentPhone],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ fontWeight: 'bold', padding: '3px 12px 3px 0', width: 160 }}>{label}</td>
                <td style={{ padding: '3px 0' }}>{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="02 — PROGRAM SCOPE & SCHEDULE">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['Program Duration', d.programWeeks ? `${d.programWeeks} weeks` : '—'],
              ['Sessions Per Week', d.sessionsPerWeek],
              ['Session Length', d.sessionLengthHours ? `${d.sessionLengthHours} hour` : '—'],
              ['Total Program Hours', d.totalHours],
              ['Agreement Date', d.effectiveDate],
              ['Target Start Date', d.targetStartDate],
              ['Target SAT Test Date', d.targetTestDate],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ fontWeight: 'bold', padding: '3px 12px 3px 0', width: 180 }}>{label}</td>
                <td style={{ padding: '3px 0' }}>{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="03 — SERVICES INCLUDED">
        <ul>
          <li>{d.totalHours} 1-on-1 tutoring sessions ({d.sessionLengthHours} hour each, {d.sessionsPerWeek}x/week) with a vetted tutor (SAT 1550+)</li>
          <li>Office hours at no additional cost: 2 sessions/week, up to 2 hours each</li>
          <li>Full-length practice tests at each program phase checkpoint</li>
          <li>Proprietary study materials, strategy guides, and drill sets</li>
          <li>Performance tracking and analytics after each practice test</li>
          <li>End-of-phase progress check-ins with Client</li>
          <li>Access to the StudyCore student and parent platform</li>
          <li>Session recordings via Fathom (confidential, accessible to student, parent, and StudyCore only)</li>
        </ul>
      </Section>

      <Section title="04 — PAYMENT TERMS">
        <p><strong>Total Program Investment:</strong> {fmt(d.totalInvestment)}</p>
        <p><strong>Payment Structure:</strong> {d.paymentStructure || '—'}</p>
        <p><strong>Amount Due at Signing:</strong> {fmt(d.totalInvestment)}</p>
        <p>All payments are processed via Stripe. <strong>NO CHARGEBACKS:</strong> Client agrees not to initiate a chargeback except where StudyCore has failed to deliver services. Unauthorized chargebacks will be formally contested using this signed Agreement.</p>
      </Section>

      <Section title="05 — CANCELLATION & REFUND POLICY">
        <p><strong>Program Pause:</strong> Up to 2 pauses per program, max 2 weeks each, with 48 hours written notice.</p>
        <p><strong>Discontinuation:</strong> Prorated refund based on 1-on-1 sessions completed to date.</p>
      </Section>

      <Section title="06 — PERFORMANCE GUARANTEE">
        <p>If Student completes all {d.totalHours} sessions, remains Engaged, and completes all assigned work but does not achieve {d.targetScore}+ on the Target SAT Test ({d.targetTestDate}), StudyCore will continue working with Student at no additional cost until {d.targetScore}+ is achieved on a subsequent official SAT.</p>
        <p><strong>Eligibility:</strong> 100% session attendance, 100% homework/practice test completion, full compliance with Client Responsibilities in Section 07.</p>
      </Section>

      <Section title="07 — CLIENT RESPONSIBILITIES">
        <ul>
          <li>Attend all sessions or provide 24+ hours notice to reschedule</li>
          <li>Max 2 reschedules/month with 24+ hours notice; additional reschedules forfeit the session</li>
          <li>Remain Engaged during all sessions</li>
          <li>Complete 100% of assigned homework, practice tests, and drills</li>
          <li>Complete practice tests independently, under timed conditions</li>
          <li>Communicate promptly with tutor and StudyCore team</li>
          <li>Ensure reliable internet and device for online sessions</li>
          <li>Keep payment method current</li>
        </ul>
      </Section>

      <Section title="08 — NON-SOLICITATION">
        <p>Client may not directly hire, solicit, or engage any StudyCore tutor for private services during and for 12 months after the program. Violation results in a fee equal to 6 months of the tutor's standard StudyCore rate.</p>
      </Section>

      <Section title="09 — TUTOR ASSIGNMENT & SUBSTITUTION">
        <p>StudyCore reserves the right to reassign Student to a different tutor if needed. Client may request a tutor change at support@studycore.net.</p>
      </Section>

      <Section title="10 — RECORDING & COMMUNICATIONS CONSENT">
        <p>Sessions recorded via Fathom. Client consents to program communications via email and SMS. Client optionally consents to anonymized score results used for marketing; may be revoked in writing.</p>
      </Section>

      <Section title="11–16 — INTELLECTUAL PROPERTY, CONFIDENTIALITY, LIABILITY, FORCE MAJEURE, DISPUTE RESOLUTION, ENTIRE AGREEMENT">
        <p>StudyCore materials are proprietary; for personal use only. Student data is confidential. Liability is capped at total amount paid. Force majeure extends applicable deadlines. Disputes resolved by arbitration in San Ramon, CA under AAA rules, governed by California law. This Agreement supersedes all prior discussions.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 6, color: '#0f172a' }}>{title}</p>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '32px 36px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const heading = {
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 12,
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

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 14,
  fontWeight: 'bold',
  color: '#374151',
};

const input = {
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 15,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 4,
};

const signBtn = {
  marginTop: 24,
  background: '#0f172a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '12px 28px',
  fontSize: 15,
  fontWeight: 'bold',
  width: '100%',
};

const linkBtn = {
  display: 'inline-block',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 24px',
  borderRadius: 6,
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: 14,
};
