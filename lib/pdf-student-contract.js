import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 56,
    color: '#111',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 12,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  effectiveLine: {
    fontSize: 9,
    color: '#555',
  },
  sectionNumber: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 2,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  detailLabel: {
    width: 160,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  detailValue: {
    flex: 1,
    fontSize: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  signaturesSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
  },
  signatureBlock: {
    marginBottom: 24,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 4,
    marginTop: 20,
    width: 280,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#555',
  },
  signedByBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
  },
  signedByText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  signedByMeta: {
    fontSize: 9,
    color: '#555',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
  },
});

function Bullet({ children }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

function Section({ number, title, children }) {
  return (
    <View>
      <Text style={styles.sectionNumber}>{String(number).padStart(2, '0')}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * @param {object} data
 * @param {string} data.effectiveDate        — e.g. "September 23, 2026"
 * @param {string} data.studentName
 * @param {string} data.studentGrade
 * @param {number} data.startingScore
 * @param {number} data.targetScore
 * @param {string} data.parentName
 * @param {string} data.parentEmail
 * @param {string} data.parentPhone
 * @param {number} data.programWeeks
 * @param {number} data.sessionsPerWeek
 * @param {number} data.sessionLengthHours
 * @param {number} data.totalHours
 * @param {string} data.targetStartDate
 * @param {string} data.targetTestDate        — e.g. "March 2027 SAT administration"
 * @param {number} data.totalInvestment
 * @param {string} data.paymentStructure      — e.g. "Full Upfront"
 * @param {string|null} data.signedName
 * @param {string|null} data.signedAt
 */
function StudentContractDocument({ data }) {
  const {
    effectiveDate, studentName, studentGrade, startingScore, targetScore,
    parentName, parentEmail, parentPhone,
    programWeeks, sessionsPerWeek, sessionLengthHours, totalHours,
    targetStartDate, targetTestDate,
    totalInvestment, paymentStructure,
    signedName, signedAt,
  } = data;

  const signedDateStr = signedAt
    ? new Date(signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const formattedInvestment = totalInvestment
    ? `$${Number(totalInvestment).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : '—';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>StudyCore LLC</Text>
          <Text style={styles.docTitle}>SAT Tutoring Services Agreement</Text>
          <Text style={styles.effectiveLine}>
            Effective {effectiveDate} between StudyCore LLC and {parentName || '[Parent Name]'}, parent or legal guardian of {studentName || '[Student Name]'}.
          </Text>
        </View>

        {/* Intro */}
        <Text style={styles.paragraph}>
          This SAT Tutoring Services Agreement ("Agreement") is entered into as of {effectiveDate} by and between StudyCore LLC, a California limited liability company ("StudyCore"), and {parentName || '[Parent Name]'} ("Client").
        </Text>
        <Text style={styles.paragraph}>
          Client represents that they are the parent or legal guardian of the Student named below and is signing this Agreement on the Student's behalf. Client accepts full legal responsibility for all obligations under this Agreement.
        </Text>

        {/* 01 */}
        <Section number={1} title="PARTIES & PROGRAM DETAILS">
          <Detail label="Student Name" value={studentName} />
          <Detail label="Grade" value={studentGrade} />
          <Detail label="Starting SAT Score" value={startingScore ? `${startingScore} (verified via diagnostic assessment completed on the StudyCore platform prior to this Agreement)` : '—'} />
          <Detail label="Target SAT Score" value={targetScore?.toString()} />
          <Detail label="Parent Name" value={parentName} />
          <Detail label="Parent Email" value={parentEmail} />
          <Detail label="Parent Phone" value={parentPhone} />
        </Section>

        {/* 02 */}
        <Section number={2} title="PROGRAM SCOPE & SCHEDULE">
          <Detail label="Program Duration" value={programWeeks ? `${programWeeks} weeks` : '—'} />
          <Detail label="Sessions Per Week" value={sessionsPerWeek?.toString()} />
          <Detail label="Session Length" value={sessionLengthHours ? `${sessionLengthHours} hour${sessionLengthHours !== 1 ? 's' : ''}` : '—'} />
          <Detail label="Total Program Hours" value={totalHours?.toString()} />
          <Detail label="Agreement Date" value={effectiveDate} />
          <Detail label="Target Start Date" value={targetStartDate} />
          <Detail label="Target SAT Test Date" value={targetTestDate} />
          <Text style={[styles.paragraph, { marginTop: 8 }]}>
            StudyCore will match Student with a vetted tutor (SAT score 1550+) based on Student's diagnostic results, strengths, weaknesses, and scheduling preferences, and will make reasonable efforts to consider Student's target schools when identifying a match.
          </Text>
        </Section>

        {/* 03 */}
        <Section number={3} title="SERVICES INCLUDED">
          <Bullet>{totalHours} 1-on-1 tutoring sessions ({sessionLengthHours} hour each, {sessionsPerWeek}x per week) with a matched, vetted tutor (SAT score 1550+)</Bullet>
          <Bullet>Access to office hours at no additional cost: two (2) sessions per week, up to two (2) hours per session. Office hours are optional and are not led by Student's assigned 1-on-1 tutor.</Bullet>
          <Bullet>Full-length practice tests completed at scheduled program checkpoints, approximately once per program phase</Bullet>
          <Bullet>Proprietary study materials, strategy guides, and drill sets via the StudyCore platform</Bullet>
          <Bullet>Performance tracking and analytics after each practice test</Bullet>
          <Bullet>End-of-phase progress check-ins with Client</Bullet>
          <Bullet>Access to the StudyCore student and parent platform for scheduling, resources, and progress tracking</Bullet>
          <Bullet>Sessions are recorded via Fathom for quality assurance and student progress review. Recordings are confidential and accessible only to the student, parent, and StudyCore team.</Bullet>
        </Section>

        {/* 04 */}
        <Section number={4} title="PAYMENT TERMS">
          <Detail label="Total Program Investment" value={formattedInvestment} />
          <Detail label="Payment Structure" value={paymentStructure} />
          <Detail label="Amount Due at Signing" value={formattedInvestment} />
          <Text style={[styles.paragraph, { marginTop: 8 }]}>
            All payments are processed securely via Stripe. Client authorizes StudyCore LLC to charge the payment method provided per the schedule above.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>NO CHARGEBACKS: </Text>Client agrees not to initiate a chargeback, payment dispute, or reversal with their financial institution or payment provider except in cases where StudyCore LLC has failed to deliver services as outlined in this Agreement, or where both parties have agreed to a refund in writing. If StudyCore LLC fails to deliver the services described herein, this Agreement is void and Client is entitled to a full refund. Any unauthorized chargebacks will be formally contested by StudyCore LLC using this signed Agreement as evidence.
          </Text>
        </Section>

        {/* 05 */}
        <Section number={5} title="CANCELLATION & REFUND POLICY">
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Program Pause: </Text>Client may pause the program up to two (2) times per program, for a maximum of two (2) weeks per pause, with at least 48 hours written notice. The program end date will extend by the duration of the pause. Pauses exceeding the limit will not extend the program timeline.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Discontinuation: </Text>If Client chooses to discontinue the program at any point, StudyCore will provide a prorated refund based on the number of 1-on-1 sessions Student has completed as of the date of discontinuation.
          </Text>
        </Section>

        {/* 06 */}
        <Section number={6} title={`PERFORMANCE GUARANTEE — WE WORK WITH YOU FREE UNTIL YOU HIT YOUR SCORE`}>
          <Text style={styles.paragraph}>
            If Student completes all {totalHours} 1-on-1 sessions included in this Agreement, remains Engaged (as defined below) throughout the program, completes all assigned homework and practice materials, and fully upholds all Client Responsibilities set out in Section 07, and does not achieve a score of {targetScore} or higher on the Target SAT Test ({targetTestDate}), StudyCore will continue working with Student at no additional cost — through up to ten (10) additional 1-on-1 tutoring sessions — until Student achieves a score of {targetScore} or higher on a subsequent official SAT or the ten-session guarantee period has been completed, whichever comes first.
          </Text>
          <Text style={styles.paragraph}>
            "Engaged" means Student is present for scheduled sessions, is responsive during instruction, and actively participates in question walkthroughs with their instructor.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Eligibility: </Text>To qualify for this guarantee, Student must (a) attend all {totalHours} one-on-one sessions included in the program, (b) remain Engaged throughout the program, (c) complete 100% of assigned homework, practice tests, and drill sets, and (d) otherwise comply with all Client Responsibilities set out in Section 07 of this Agreement. To verify eligibility and continued progress, Client agrees to have Student sit for the Target SAT Test and to provide StudyCore with the official College Board score report.
          </Text>
        </Section>

        {/* 07 */}
        <Section number={7} title="CLIENT RESPONSIBILITIES">
          <Text style={styles.paragraph}>
            Client and Student agree to the following. Full compliance with these responsibilities throughout the program is required to qualify for the Performance Guarantee in Section 06.
          </Text>
          <Bullet>Attend all scheduled sessions or provide at least 24 hours notice to reschedule. Sessions missed without 24-hour notice may be forfeited at StudyCore's discretion and will count toward the session total for guarantee eligibility purposes.</Bullet>
          <Bullet>Student may reschedule up to a maximum of 2 times per calendar month with at least 24 hours notice. Additional reschedules beyond this limit will result in the session being forfeited.</Bullet>
          <Bullet>Remain Engaged during all sessions, as defined in Section 06, and as documented by the assigned tutor</Bullet>
          <Bullet>Complete 100% of assigned homework, practice tests, and drill sets between sessions. StudyCore tracks homework completion via session reports submitted by the assigned tutor. The Performance Guarantee is void if compliance falls below 100%.</Bullet>
          <Bullet>Complete all assigned practice tests independently outside of sessions, under timed conditions</Bullet>
          <Bullet><Text style={styles.bold}>SAT Registration: </Text>Client must register Student for the Target SAT Test ({targetTestDate}) within four (4) weeks of the program start date and provide StudyCore with confirmation of registration. Failure to register within this window voids the Performance Guarantee.</Bullet>
          <Bullet>Communicate promptly with their tutor and the StudyCore team</Bullet>
          <Bullet>Ensure Student has reliable internet and a device for online sessions</Bullet>
          <Bullet>Keep payment method on file current and up to date</Bullet>
        </Section>

        {/* 08 */}
        <Section number={8} title="NON-SOLICITATION">
          <Text style={styles.paragraph}>
            Client agrees not to directly hire, solicit, or engage any StudyCore tutor for private tutoring services outside of StudyCore LLC during the program and for 12 months following the program end date. Violation of this clause will result in a fee equal to 6 months of the tutor's standard StudyCore rate, payable immediately upon demand.
          </Text>
        </Section>

        {/* 09 */}
        <Section number={9} title="TUTOR ASSIGNMENT & SUBSTITUTION">
          <Text style={styles.paragraph}>
            StudyCore LLC reserves the right to reassign Student to a different tutor if the original tutor becomes unavailable, or if Client and StudyCore agree a different tutor would be a better fit. StudyCore will notify Client of any tutor change and ensure continuity of instruction. Client may request a tutor change by contacting support@studycore.net.
          </Text>
        </Section>

        {/* 10 */}
        <Section number={10} title="SESSION RECORDING & COMMUNICATIONS CONSENT">
          <Text style={styles.paragraph}>
            Sessions are recorded via Fathom for quality assurance and student progress review. Recordings are confidential and accessible only to the student, parent, and StudyCore team.
          </Text>
          <Text style={styles.paragraph}>
            Client consents to receiving program-related communications via email and SMS from StudyCore LLC, including session reminders, progress updates, and billing notifications.
          </Text>
          <Text style={styles.paragraph}>
            Client optionally consents to StudyCore LLC using anonymized score improvement results for marketing purposes. This consent is indicated by signing this Agreement and may be revoked in writing at any time.
          </Text>
        </Section>

        {/* 11 */}
        <Section number={11} title="INTELLECTUAL PROPERTY">
          <Text style={styles.paragraph}>
            All materials provided by StudyCore LLC are proprietary intellectual property of StudyCore LLC. Client and Student may use materials solely for personal, non-commercial SAT preparation. Reproduction, distribution, or resale without written consent is prohibited.
          </Text>
        </Section>

        {/* 12 */}
        <Section number={12} title="CONFIDENTIALITY & DATA">
          <Text style={styles.paragraph}>
            StudyCore LLC will keep Client and Student information confidential and will not sell or share personal data with third parties except as required to deliver services herein.
          </Text>
        </Section>

        {/* 13 */}
        <Section number={13} title="LIMITATION OF LIABILITY">
          <Text style={styles.paragraph}>
            StudyCore LLC's total liability shall not exceed the total amount paid by Client. StudyCore LLC is not liable for indirect, incidental, or consequential damages.
          </Text>
        </Section>

        {/* 14 */}
        <Section number={14} title="FORCE MAJEURE">
          <Text style={styles.paragraph}>
            Neither party shall be held liable for delays or failures in performance resulting from events outside their reasonable control, including but not limited to College Board test cancellations, natural disasters, acts of government, or other force majeure events. In such cases, applicable deadlines, including the guarantee window, will be extended to the next reasonable opportunity.
          </Text>
        </Section>

        {/* 15 */}
        <Section number={15} title="DISPUTE RESOLUTION">
          <Text style={styles.paragraph}>
            Disputes shall first be attempted informally via support@studycore.net. If unresolved within 30 days, disputes shall be resolved by binding arbitration in San Ramon, California under AAA rules. Governed by California law.
          </Text>
        </Section>

        {/* 16 */}
        <Section number={16} title="ENTIRE AGREEMENT">
          <Text style={styles.paragraph}>
            This Agreement supersedes all prior discussions and agreements. Modifications must be in writing signed by both parties. If any provision is found unenforceable, remaining provisions remain in full force.
          </Text>
        </Section>

        {/* Signatures */}
        <View style={styles.signaturesSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>SIGNATURES</Text>

          <View style={styles.signatureBlock}>
            <View style={styles.signedByBox}>
              <Text style={styles.signedByText}>Electronically signed by: Neil Shah</Text>
              <Text style={styles.signedByMeta}>Title: Co-Founder, StudyCore LLC</Text>
              <Text style={styles.signedByMeta}>Date: {effectiveDate}</Text>
            </View>
          </View>

          <View style={styles.signatureBlock}>
            {signedName ? (
              <View style={styles.signedByBox}>
                <Text style={styles.signedByText}>Electronically signed by: {signedName}</Text>
                <Text style={styles.signedByMeta}>Date: {signedDateStr}</Text>
                <Text style={styles.signedByMeta}>
                  By signing this Agreement electronically, Client accepts all terms above on behalf of themselves and the Student.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Parent/Guardian Name (Print): {parentName || '___________________________'}</Text>
                <Text style={styles.signatureLabel}>Date: ___________________________</Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.footer}>
          StudyCore LLC · San Ramon, California · support@studycore.net · studycore.net
        </Text>
      </Page>
    </Document>
  );
}

export async function generateStudentContractPdf(data) {
  return renderToBuffer(<StudentContractDocument data={data} />);
}
