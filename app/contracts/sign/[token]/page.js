'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SignContractPage() {
  const { token } = useParams();
  const [state, setState] = useState('loading');
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
        if (data.alreadySigned) setState('already_signed');
        else if (data.error) { setErrorMsg(data.error); setState('error'); }
        else { setContractInfo(data); setState('ready'); }
      })
      .catch(() => { setErrorMsg('Failed to load contract.'); setState('error'); });
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

  const isTutor = contractInfo?.type === 'tutor';
  const isTutorStudent = contractInfo?.type === 'tutor-student';

  function contractTitle() {
    if (isTutorStudent) return 'Tutor-Student Assignment Agreement';
    if (isTutor) return 'Tutor Services Agreement';
    return 'SAT Tutoring Services Agreement';
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#0f172a', color: '#fff', fontWeight: '700', fontSize: 13, padding: '4px 10px', borderRadius: 4 }}>SC</div>
          <div>
            <span style={{ fontWeight: '600', fontSize: 14, color: '#0f172a' }}>StudyCore LLC</span>
            <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 10 }}>· Electronic Signature Request</span>
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Powered by StudyCore Contracts</span>
      </div>

      <div style={{ maxWidth: 820, margin: '40px auto', padding: '0 24px 60px' }}>

        {state === 'loading' && (
          <div style={card}>
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>Loading your contract…</p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div style={{ ...card, borderLeft: '4px solid #ef4444' }}>
            <p style={{ fontWeight: '700', fontSize: 16, color: '#dc2626', marginBottom: 8 }}>Unable to Load Contract</p>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Contact <a href="mailto:support@studycore.net" style={{ color: '#0f172a' }}>support@studycore.net</a> for help.</p>
          </div>
        )}

        {state === 'already_signed' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={successCircle}>✓</div>
              <div>
                <p style={{ fontWeight: '700', fontSize: 17, margin: '0 0 4px' }}>Already Signed</p>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>This contract has already been signed. No further action is needed.</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 20 }}>Questions? <a href="mailto:support@studycore.net" style={{ color: '#0f172a' }}>support@studycore.net</a></p>
          </div>
        )}

        {state === 'success' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={successCircle}>✓</div>
              <div>
                <p style={{ fontWeight: '700', fontSize: 17, margin: '0 0 4px' }}>Agreement Signed</p>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Thank you, <strong>{signedName}</strong>. Your signed agreement has been recorded.</p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                A signed copy has been saved on file with StudyCore. By signing electronically, you have agreed to all terms of the {contractTitle()} under the ESIGN Act.
              </p>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>A copy has been sent to the StudyCore team at info@studycore.net.</p>
          </div>
        )}

        {(state === 'ready' || state === 'signing') && contractInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Contract info banner */}
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 4px' }}>StudyCore LLC</p>
                <p style={{ color: '#fff', fontWeight: '700', fontSize: 17, margin: '0 0 2px' }}>
                  {contractTitle()}
                </p>
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                  Sent to {contractInfo.recipientName}
                  {contractInfo.contractData?.studentName ? ` · Student: ${contractInfo.contractData.studentName}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: '600' }}>Awaiting Signature</span>
              </div>
            </div>

            {/* Contract body */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <h2 style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', margin: 0 }}>Contract Terms</h2>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Scroll to review before signing</span>
              </div>
              <div style={{
                maxHeight: 480, overflowY: 'auto',
                fontSize: 13, lineHeight: 1.8, color: '#334155',
                fontFamily: 'Georgia, serif',
                paddingRight: 8,
              }}>
                {isTutorStudent
                  ? <TutorStudentContractText data={contractInfo.contractData} recipientName={contractInfo.recipientName} />
                  : isTutor
                    ? <TutorContractText data={contractInfo.contractData} recipientName={contractInfo.recipientName} />
                    : <StudentContractText data={contractInfo.contractData} />}
              </div>
            </div>

            {/* Signature panel */}
            <div style={card}>
              <h2 style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>Sign this Agreement</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                By typing your full legal name below and checking the box, you are electronically signing this Agreement. This signature is legally binding under the ESIGN Act (15 U.S.C. § 7001).
              </p>
              <form onSubmit={handleSign}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Full Legal Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={signedName}
                    onChange={e => setSignedName(e.target.value)}
                    placeholder={(isTutor || isTutorStudent) ? 'Your full legal name' : (contractInfo.contractData?.parentName || 'Parent/Guardian full legal name')}
                    required
                    disabled={state === 'signing'}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 16, fontFamily: 'Georgia, serif', boxSizing: 'border-box', outline: 'none', color: '#0f172a', background: '#fafafa' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    disabled={state === 'signing'}
                    style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    I confirm that I have read and understand all terms of this Agreement{isTutorStudent ? ', including the Early Departure Consequences in Section 3,' : ''} and agree to be legally bound by them. I acknowledge this electronic signature carries the same legal weight as a handwritten signature.
                  </span>
                </label>

                {/* Signature preview */}
                {signedName && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '14px 18px', marginBottom: 20 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>Signature Preview</p>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#0f172a', margin: 0, fontStyle: 'italic' }}>{signedName}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!signedName.trim() || !agreed || state === 'signing'}
                  style={{
                    ...primaryBtn,
                    width: '100%',
                    padding: '14px',
                    fontSize: 15,
                    opacity: (!signedName.trim() || !agreed || state === 'signing') ? 0.4 : 1,
                    cursor: (!signedName.trim() || !agreed || state === 'signing') ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state === 'signing' ? 'Processing signature…' : `Sign Agreement`}
                </button>
              </form>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
              Questions? Contact <a href="mailto:support@studycore.net" style={{ color: '#475569' }}>support@studycore.net</a>
            </p>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', background: '#fff', padding: '16px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>StudyCore LLC · San Ramon, California · support@studycore.net · studycore.net</p>
      </div>
    </div>
  );
}

// ─── Contract text renderers ──────────────────────────────────────────────────

function TutorContractText({ data, recipientName }) {
  const name = recipientName || data?.tutorName || '[Tutor Name]';
  const date = data?.effectiveDate || '';
  const students = data?.assignedStudents ? data.assignedStudents.split(',').map(s => s.trim()).filter(Boolean) : [];
  return (
    <div>
      <p>This Tutor Services Agreement is entered into as of <strong>{date}</strong> by and between <strong>StudyCore LLC</strong>, a California limited liability company, and <strong>{name}</strong> ("Tutor").</p>

      {students.length > 0 && (
        <ContractSection title="Assigned Students">
          <p>Tutor commits to delivering services for the following student(s) for the full duration of each student's program:</p>
          <ul>{students.map((s, i) => <li key={i}><strong>{s}</strong></li>)}</ul>
        </ContractSection>
      )}

      <ContractSection title="01 — Independent Contractor Relationship">
        <p>Tutor is an independent contractor, not an employee of StudyCore LLC. No employment relationship is created by this Agreement. Tutor is not entitled to employee benefits of any kind.</p>
        <p><strong>SAT Score Accuracy:</strong> Tutor represents and warrants that they have achieved a verified SAT score of 1550 or higher and that all information provided to StudyCore is accurate and truthful. Tutor must provide official proof of score upon request. Misrepresentation of score or qualifications is grounds for immediate termination without pay and may result in legal action.</p>
      </ContractSection>
      <ContractSection title="02 — Services & Obligations">
        <ul>
          <li>Deliver all assigned 1-on-1 sessions per each student's agreed schedule</li>
          <li>Lead office hours only when explicitly assigned by StudyCore</li>
          <li>Submit a written session report after every session</li>
          <li>Respond to all messages from StudyCore and parents within 24 hours</li>
          <li>Monitor student progress proactively and report concerns immediately</li>
          <li>Participate in weekly check-ins with Harshil Chilukuri</li>
          <li>Conduct all sessions with camera on, reliable internet, and via the platform designated by StudyCore (currently Zoom with Fathom recording)</li>
          <li><strong>Rescheduling:</strong> Must give 24+ hours notice. Rescheduling with less than 24 hours notice = 1 strike. With proper notice, max 3 reschedules per student per calendar month — a 4th reschedule in the same month = 1 strike.</li>
        </ul>
      </ContractSection>
      <ContractSection title="03 — Student Commitment">
        <p>Once Tutor accepts a student assignment, Tutor commits to remaining with that student for the full duration of the student's program. Early departure without prior written approval from StudyCore is a terminable offense and may affect final compensation. Exceptions may be made for force majeure or StudyCore-initiated reassignment.</p>
      </ContractSection>
      <ContractSection title="04 — Performance Standards & Strike System">
        <ul>
          <li><strong>1 Strike:</strong> Arriving 10 or more minutes late to a scheduled session</li>
          <li><strong>2 Strikes:</strong> Missing a scheduled session without prior notice. Tutor forfeits pay for that session.</li>
          <li><strong>3 Strikes:</strong> Termination without pay for the current pay period</li>
        </ul>
        <p>Strikes are issued at StudyCore's discretion. Tutor will be notified in writing each time a strike is issued.</p>
      </ContractSection>
      <ContractSection title="05 — Payment & Compensation">
        <p><strong>Rate:</strong> $20.00/hour for 1-on-1 sessions and office hours.</p>
        <p><strong>Pay Schedule:</strong> 15th and last day of each month via Zelle.</p>
        <p><strong>Missed Sessions:</strong> Tutor forfeits pay for sessions missed without prior notice.</p>
        <p><strong>Refund Clause:</strong> If a student discontinues within their first 3 sessions, Tutor will not receive payment for those sessions. If the discontinuation is due to Tutor's conduct, Tutor also receives one strike. StudyCore may adjust Tutor's rate with 30 days written notice.</p>
      </ContractSection>
      <ContractSection title="06 — Tax Responsibility">
        <p>Tutor is solely responsible for all federal, state, and local taxes on income earned. StudyCore will not withhold income tax, Social Security, or Medicare. StudyCore will issue a 1099-NEC for earnings of $600 or more in any calendar year. Tutor agrees to provide a completed W-9 upon request.</p>
      </ContractSection>
      <ContractSection title="07 — Session Recording & Confidentiality">
        <p>All sessions are recorded via Fathom. By signing, Tutor consents to recording. Recordings are accessible only to the student, parent, and StudyCore team. All student information is strictly confidential. This obligation survives termination of the Agreement.</p>
      </ContractSection>
      <ContractSection title="08 — Intellectual Property">
        <p>All StudyCore materials are proprietary intellectual property of StudyCore LLC. Tutor may not reproduce, distribute, resell, or use them outside of StudyCore-assigned sessions without written consent.</p>
      </ContractSection>
      <ContractSection title="09 — Non-Solicitation">
        <p>Tutor may not directly hire, solicit, or engage any StudyCore student for private tutoring during this Agreement and for 12 months following its termination. Violation results in a fee equal to 6 months of Tutor's standard StudyCore rate.</p>
      </ContractSection>
      <ContractSection title="10 — Non-Disparagement">
        <p>Tutor agrees not to make any disparaging, defamatory, or negative statements about StudyCore LLC, its founders, employees, or services to current or former students, parents, or in any public forum (including but not limited to Google, Yelp, Reddit, or social media). Tutor also agrees not to encourage any student or parent to request a chargeback, dispute a payment, or file a complaint against StudyCore. This obligation survives termination of this Agreement.</p>
      </ContractSection>
      <ContractSection title="11 — Termination">
        <p><strong>Tutor-Initiated:</strong> 2 weeks written notice required. Tutor will be compensated for sessions delivered during the notice period.</p>
        <p><strong>StudyCore-Initiated for Cause:</strong> Immediate termination without pay for the current pay period for: 3-strike threshold, unprofessional conduct, confidentiality breach, student abandonment without approval, or other serious misconduct.</p>
        <p>Upon termination, Tutor must immediately cease use of all StudyCore materials.</p>
      </ContractSection>
      <ContractSection title="12 — Limitation of Liability">
        <p>StudyCore's total liability shall not exceed amounts paid to Tutor in the 60 days preceding the claim. StudyCore is not liable for indirect or consequential damages.</p>
      </ContractSection>
      <ContractSection title="13 — Dispute Resolution & Governing Law">
        <p>Disputes first via support@studycore.net. If unresolved in 30 days: binding arbitration in San Ramon, California under AAA rules. Governed by California law.</p>
      </ContractSection>
      <ContractSection title="14 — Entire Agreement">
        <p>This Agreement supersedes all prior discussions. Modifications must be in writing and signed by both parties. If any provision is unenforceable, remaining provisions remain in full force.</p>
      </ContractSection>
    </div>
  );
}

function TutorStudentContractText({ data, recipientName }) {
  const d = data || {};
  const name = recipientName || d.tutorName || '[Tutor Name]';
  return (
    <div>
      <p>This Tutor-Student Assignment Agreement is entered into as of <strong>{d.effectiveDate || '—'}</strong> by and between <strong>StudyCore LLC</strong> and <strong>{name}</strong> ("Tutor"). This Agreement governs Tutor's assignment to student <strong>{d.studentName || '[Student Name]'}</strong> and supplements the General Tutor Services Agreement already signed.</p>

      <ContractSection title="Assignment Details">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['Student Name', d.studentName],
              ['Target SAT Score', d.targetScore],
              ['Program Duration', d.programWeeks ? `${d.programWeeks} weeks` : undefined],
              ['Sessions Per Week', d.sessionsPerWeek],
              ['Session Length', d.sessionLengthHours ? `${d.sessionLengthHours} hour(s)` : undefined],
              ['Total Hours', d.totalHours],
              ['Session Schedule', d.sessionDaysTimes],
              ['Start Date', d.startDate],
              ['End Date', d.endDate],
            ].map(([l, v]) => (
              <tr key={l} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ fontWeight: '700', padding: '5px 12px 5px 0', width: 160, verticalAlign: 'top' }}>{l}</td>
                <td style={{ padding: '5px 0', color: '#475569' }}>{v || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ContractSection>

      <ContractSection title="01 — Acceptance of Assignment">
        <p>By signing this Agreement, Tutor confirms acceptance of this assignment and commits to delivering all scheduled sessions for the full duration of the student's program as defined above.</p>
      </ContractSection>

      <ContractSection title="02 — Full-Program Commitment">
        <p>Tutor commits to remaining with {d.studentName || 'the assigned student'} for the full duration of the program. This commitment runs from the Start Date through the End Date listed above. Personal scheduling conflicts or competing commitments do not qualify as exceptions. Exceptions may be granted only for documented force majeure or StudyCore-initiated reassignment.</p>
      </ContractSection>

      <ContractSection title="03 — Early Departure Consequences">
        <div style={{ background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: 4, padding: '10px 14px', marginBottom: 12 }}>
          <p style={{ fontWeight: '700', color: '#c2410c', marginBottom: 6 }}>IMPORTANT — Read Carefully</p>
          <p style={{ marginBottom: 0 }}>If Tutor departs from this assignment before the program End Date without prior written approval from StudyCore, all four consequences below apply.</p>
        </div>
        <p><strong>(a) Four-Week Notice Requirement:</strong> Tutor must provide a minimum of four (4) weeks written notice before ending this assignment. During the notice period, Tutor must continue delivering all scheduled sessions. Failure to provide adequate notice is a terminable offense.</p>
        <p><strong>(b) Pay Clawback:</strong> StudyCore reserves the right to clawback payments made to Tutor in the most recently completed pay period. This may be applied against amounts owed to Tutor or demanded as repayment.</p>
        <p><strong>(c) Refund Liability:</strong> If Tutor's early departure causes StudyCore to issue a refund to the student's family, Tutor is liable for up to two (2) weeks of Tutor's standard hourly rate. StudyCore will notify Tutor in writing before exercising this clause.</p>
        <p><strong>(d) Permanent Rehire Ban:</strong> Tutor who abandons an assignment mid-program without written approval will be permanently ineligible for future engagement with StudyCore LLC in any capacity.</p>
      </ContractSection>

      <ContractSection title="04 — Session Obligations & Reporting">
        <ul>
          <li>Deliver all sessions per the schedule listed above</li>
          <li>Submit a session report within 24 hours of each session documenting content covered, student engagement, and homework assigned</li>
          <li>Maintain professional communication with the student's family</li>
          <li>Notify StudyCore immediately if any session must be rescheduled</li>
          <li><strong>Immediate Escalation Required:</strong> Notify StudyCore within 24 hours if: (a) student fails to complete assigned homework, (b) student appears disengaged or unresponsive during sessions, (c) any academic, motivational, or behavioral concern arises that may affect progress toward target score, or (d) any other issue that could impact the program outcome. Failure to escalate known issues is grounds for a strike.</li>
          <li>Participate in weekly check-ins with the StudyCore team to review {d.studentName || "this student"}'s progress, flag concerns, and align on next steps</li>
        </ul>
      </ContractSection>

      <ContractSection title="05 — Payment for This Assignment">
        <p>Compensation is governed by the General Tutor Services Agreement ($20.00/hour, paid on the 15th and last day of each month via Zelle).</p>
        <p><strong>Performance Bonus & Rate Progression:</strong> The $200.00 is a fixed cost to StudyCore for this assignment. If {d.studentName || 'Student'} achieves their target score of {d.targetScore || '—'} on the first official SAT after completing the program, the $200.00 is paid to Tutor as a performance bonus and Tutor advances to the next rate tier ($20 → $22 → $25 → $27 → $30 → $32 → $35/hr max), taking effect the pay period following score confirmation. If the performance guarantee is triggered (see Section 06), the $200.00 is instead allocated to fund the guarantee session period and Tutor forfeits the bonus for this assignment.</p>
        <p><strong>Refund Clause:</strong> If the student discontinues within the first 3 sessions, Tutor will not receive payment for those sessions. If the discontinuation is due to Tutor's conduct, Tutor also receives one (1) strike.</p>
      </ContractSection>

      <ContractSection title="06 — Performance Guarantee Obligation">
        <p>StudyCore guarantees students that if they complete the full program without reaching their target score, StudyCore continues working with them at no additional cost until the target is achieved.</p>
        <p>If {d.studentName || 'Student'} triggers this guarantee and Tutor remains actively engaged with StudyCore, Tutor is required to continue delivering sessions beyond the original program End Date. StudyCore will compensate Tutor at the standard rate ($20.00/hour) for guarantee-period sessions, funded by the $200.00 guarantee allocation described in Section 05. This is a continuation of the current assignment — no new contract required.</p>
        <p><strong>Guarantee Session Cap:</strong> Tutor's guarantee obligation is capped at ten (10) additional sessions. After ten sessions have been delivered beyond the original program End Date, Tutor's obligation ends regardless of whether {d.studentName || 'Student'} has achieved their target score. StudyCore will determine next steps for the student independently.</p>
        <p><strong>Performance Review:</strong> If the guarantee is triggered, StudyCore will review all session reports Tutor submitted for this assignment. If the review identifies tutor-side deficiencies (missed reports, poor session quality, failure to meet Section 04 obligations), Tutor receives 1 strike. If the review is clean, no consequence applies. This review may be conducted even if Tutor is no longer with StudyCore.</p>
      </ContractSection>

      <ContractSection title="07 — Relationship to General Agreement">
        <p>This Assignment Agreement supplements, and does not replace, the General Tutor Services Agreement. In the event of conflict, the more restrictive provision applies. All other General Agreement terms remain in full force.</p>
      </ContractSection>

      <ContractSection title="08 — Entire Assignment Agreement">
        <p>This document constitutes the entire agreement for this specific student assignment. Modifications must be in writing and signed by both parties.</p>
      </ContractSection>
    </div>
  );
}

function StudentContractText({ data }) {
  const d = data || {};
  const fmt = (n) => n ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';
  return (
    <div>
      <p>This SAT Tutoring Services Agreement is entered into as of <strong>{d.effectiveDate || '—'}</strong> by and between <strong>StudyCore LLC</strong> and <strong>{d.parentName || '[Parent Name]'}</strong> ("Client"), parent or legal guardian of <strong>{d.studentName || '[Student Name]'}</strong>. Client accepts full legal responsibility for all obligations under this Agreement.</p>

      <ContractSection title="01 — Parties & Program Details">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[['Student Name', d.studentName], ['Grade', d.studentGrade], ['Starting SAT Score', d.startingScore ? `${d.startingScore} (verified via diagnostic)` : '—'],
              ['Target SAT Score', d.targetScore], ['Parent Name', d.parentName], ['Parent Email', d.parentEmail], ['Parent Phone', d.parentPhone]].map(([l, v]) => (
              <tr key={l} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ fontWeight: '700', padding: '5px 12px 5px 0', width: 160, verticalAlign: 'top' }}>{l}</td>
                <td style={{ padding: '5px 0', color: '#475569' }}>{v || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ContractSection>

      <ContractSection title="02 — Program Scope & Schedule">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[['Program Duration', d.programWeeks ? `${d.programWeeks} weeks` : '—'],
              ['Sessions Per Week', d.sessionsPerWeek], ['Session Length', d.sessionLengthHours ? `${d.sessionLengthHours} hour` : '—'],
              ['Total Program Hours', d.totalHours], ['Agreement Date', d.effectiveDate],
              ['Target Start Date', d.targetStartDate], ['Target SAT Test Date', d.targetTestDate]].map(([l, v]) => (
              <tr key={l} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ fontWeight: '700', padding: '5px 12px 5px 0', width: 180, verticalAlign: 'top' }}>{l}</td>
                <td style={{ padding: '5px 0', color: '#475569' }}>{v || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 10 }}>StudyCore will match Student with a vetted tutor (SAT 1550+) based on diagnostic results, strengths, weaknesses, and scheduling preferences.</p>
      </ContractSection>

      <ContractSection title="03 — Services Included">
        <ul>
          <li>{d.totalHours} 1-on-1 sessions ({d.sessionLengthHours} hr, {d.sessionsPerWeek}x/week) with a vetted tutor (SAT 1550+)</li>
          <li>Office hours at no extra cost: 2 sessions/week, up to 2 hours each</li>
          <li>Full-length practice tests at each program phase checkpoint</li>
          <li>Proprietary study materials, strategy guides, and drill sets</li>
          <li>Performance tracking and analytics after each practice test</li>
          <li>End-of-phase progress check-ins with Client</li>
          <li>Access to the StudyCore student and parent platform</li>
          <li>Sessions recorded via Fathom (confidential — student, parent, and StudyCore only)</li>
        </ul>
      </ContractSection>

      <ContractSection title="04 — Payment Terms">
        <p><strong>Total Program Investment:</strong> {fmt(d.totalInvestment)}<br />
        <strong>Payment Structure:</strong> {d.paymentStructure || '—'}<br />
        <strong>Amount Due at Signing:</strong> {fmt(d.totalInvestment)}</p>
        <p>All payments processed via Stripe. <strong>NO CHARGEBACKS</strong> except where StudyCore fails to deliver services. Unauthorized chargebacks will be formally contested using this signed Agreement.</p>
      </ContractSection>

      <ContractSection title="05 — Cancellation & Refund Policy">
        <p><strong>Program Pause:</strong> Up to 2 pauses per program, max 2 weeks each, with 48 hours written notice. Program end date extends accordingly.</p>
        <p><strong>Discontinuation:</strong> Prorated refund based on 1-on-1 sessions completed to date of discontinuation.</p>
      </ContractSection>

      <ContractSection title="06 — Performance Guarantee">
        <p>If Student completes all {d.totalHours || '—'} sessions, remains Engaged throughout the program, completes all assigned work, and does not achieve {d.targetScore || '—'}+ on the Target SAT Test ({d.targetTestDate || '—'}), StudyCore will continue working with Student at no additional cost until {d.targetScore || '—'}+ is achieved on a subsequent official SAT.</p>
        <p><strong>Eligibility requires:</strong> 100% session attendance, 100% homework/practice test completion, full compliance with Section 07.</p>
      </ContractSection>

      <ContractSection title="07 — Client Responsibilities">
        <ul>
          <li>24+ hours notice to reschedule; max 2 reschedules/month — additional reschedules forfeit the session</li>
          <li>Remain Engaged during all sessions</li>
          <li>Complete 100% of assigned homework, practice tests, and drills. StudyCore tracks compliance via tutor session reports — Performance Guarantee is void if compliance falls below 100%.</li>
          <li>Complete practice tests independently under timed conditions</li>
          <li><strong>SAT Registration:</strong> Register Student for the Target SAT Test ({d.targetTestDate || '—'}) within 4 weeks of program start and provide StudyCore with confirmation. Failure to register within this window voids the Performance Guarantee.</li>
          <li>Reliable internet and device for online sessions</li>
          <li>Keep payment method on file current</li>
        </ul>
      </ContractSection>

      <ContractSection title="08 — Non-Solicitation">
        <p>Client may not directly hire or solicit any StudyCore tutor for private services during the program and for 12 months following the program end date. Violation: fee equal to 6 months of the tutor's standard StudyCore rate.</p>
      </ContractSection>

      <ContractSection title="09 — Tutor Assignment & Substitution">
        <p>StudyCore reserves the right to reassign Student to a different tutor if needed. Client may request a tutor change at support@studycore.net.</p>
      </ContractSection>

      <ContractSection title="10 — Recording & Communications Consent">
        <p>Sessions recorded via Fathom. Client consents to program communications via email and SMS. Client optionally consents to anonymized score results used for marketing; revocable in writing at any time.</p>
      </ContractSection>

      <ContractSection title="11–16 — IP, Confidentiality, Liability, Force Majeure, Disputes, Entire Agreement">
        <p>All StudyCore materials are proprietary and for personal use only. Student data is confidential. Liability capped at total amount paid. Force majeure extends applicable deadlines. Disputes resolved by arbitration in San Ramon, CA under AAA rules, governed by California law. This Agreement supersedes all prior discussions; modifications require written agreement.</p>
      </ContractSection>
    </div>
  );
}

function ContractSection({ title, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <p style={{ fontWeight: '700', fontSize: 13, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 10 }}>{title}</p>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const primaryBtn = { display: 'inline-block', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, padding: '11px 24px', fontSize: 14, fontWeight: '600', cursor: 'pointer', textDecoration: 'none' };
const successCircle = { width: 44, height: 44, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: '700', flexShrink: 0 };
