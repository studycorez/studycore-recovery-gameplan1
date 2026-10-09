import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const C = {
  navy:      '#1B365D',
  blue:      '#2E75B6',
  green:     '#27AE60',
  orange:    '#D4740E',
  red:       '#C0392B',
  white:     '#FFFFFF',
  offWhite:  '#F7FAFD',
  lightBlue: '#EAF3FB',
  border:    '#DDE3EC',
  textDark:  '#1A1A1A',
  textMid:   '#444444',
  textLight: '#777777',
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: 30, paddingBottom: 40,
    paddingLeft: 36, paddingRight: 36,
    fontFamily: 'Helvetica', fontSize: 9, color: C.textDark,
  },
  header: {
    backgroundColor: C.navy, borderRadius: 4, padding: 12, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerBrand:  { color: '#7FB3D8', fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 2, marginBottom: 3 },
  headerName:   { color: C.white,   fontSize: 16,  fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  headerSub:    { color: '#B8CDE0', fontSize: 8,   fontFamily: 'Helvetica-Oblique' },
  headerBadge:  { backgroundColor: C.blue, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4 },
  headerBadgeText: { color: C.white, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },

  metricRow:   { flexDirection: 'row', gap: 5, marginBottom: 8 },
  metricCard:  { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 8, alignItems: 'center' },
  metricLabel: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.blue, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase', textAlign: 'center' },
  metricValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 1 },
  metricSub:   { fontSize: 6.5, color: C.textLight, textAlign: 'center' },

  howToBox: {
    backgroundColor: C.lightBlue, borderWidth: 1, borderColor: C.blue,
    borderRadius: 4, padding: 12, marginBottom: 8,
  },
  howToTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.blue, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  howToItem:  { fontSize: 8, color: C.textDark, marginBottom: 5, paddingLeft: 8 },

  tableHeader: {
    flexDirection: 'row', backgroundColor: C.navy, borderRadius: 2,
    paddingVertical: 4, paddingHorizontal: 4, marginTop: 4,
  },
  tableHeaderCell: { color: C.white, fontSize: 6.5, fontFamily: 'Helvetica-Bold' },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border,
    paddingVertical: 4, paddingHorizontal: 4, alignItems: 'center',
  },
  tableCell: { fontSize: 8, color: C.textDark },

  ptBanner: {
    flexDirection: 'row', backgroundColor: '#FEF3E2', borderLeftWidth: 3,
    borderLeftColor: C.orange, paddingVertical: 6, paddingHorizontal: 8,
    marginVertical: 2, borderRadius: 2, alignItems: 'center',
  },
  ptBannerFinal: {
    flexDirection: 'row', backgroundColor: '#FDEDEC', borderLeftWidth: 3,
    borderLeftColor: C.red, paddingVertical: 6, paddingHorizontal: 8,
    marginVertical: 2, borderRadius: 2, alignItems: 'center',
  },

  weekLabel: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy,
    backgroundColor: C.lightBlue, paddingVertical: 3, paddingHorizontal: 6,
    borderRadius: 2, marginBottom: 1, marginTop: 4,
  },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: C.textLight },
});

function Footer({ studentName }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>StudyCore · {studentName} · Assignment Schedule · Self-Study Plan</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function weekLabel(weekNum, programStartDate) {
  if (!programStartDate) return `Week ${weekNum}`;
  const start = new Date(programStartDate + 'T00:00:00');
  const weekStart = new Date(start.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd   = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week ${weekNum}  ·  ${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

function fmtTime(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function GroupDocument({ data }) {
  const { studentName, baselineScore, rwScore, mathScore, targetScore, targetTestDate,
          programStartDate, topicSequence, weeklyAssignments, programSummary } = data;
  const ps = programSummary;
  const feasColor = { reachable: C.green, tight: C.orange, unlikely: C.red }[ps.feasibility] || C.textLight;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Footer studentName={studentName} />

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerBrand}>S T U D Y C O R E  ·  S E L F - S T U D Y  P L A N</Text>
            <Text style={s.headerName}>{studentName}</Text>
            <Text style={s.headerSub}>
              {baselineScore} → {targetScore} · +{ps.targetGain} pts
              {targetTestDate ? ` · Test: ${targetTestDate}` : ''}
            </Text>
          </View>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>GROUP SESSION</Text>
          </View>
        </View>

        {/* Score cards */}
        <View style={s.metricRow}>
          {[
            { label: 'Baseline', value: baselineScore, sub: 'Total SAT' },
            { label: 'R&W',      value: rwScore || '—', sub: 'Reading & Writing' },
            { label: 'Math',     value: mathScore || '—', sub: 'Mathematics' },
            { label: 'Target',   value: targetScore, sub: targetTestDate || 'TBD' },
            { label: 'Gap',      value: `+${ps.targetGain}`, sub: 'points needed' },
          ].map((m, i) => (
            <View key={i} style={s.metricCard}>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={s.metricValue}>{m.value}</Text>
              <Text style={s.metricSub}>{m.sub}</Text>
            </View>
          ))}
        </View>

        {/* Summary cards */}
        <View style={s.metricRow}>
          {[
            { label: 'Topics to Complete', value: String(ps.topicsToTeach), sub: 'HighScores modules' },
            { label: 'Weeks',              value: String(ps.weeksUntilTest), sub: 'until test' },
            { label: 'Practice Tests',     value: String(ps.practiceTestCount), sub: 'checkpoints' },
            { label: 'Feasibility',        value: ps.feasibility, sub: `${ps.totalDiagnosticMisses} diag. misses` },
          ].map((m, i) => (
            <View key={i} style={[s.metricCard, m.label === 'Feasibility' && { borderColor: feasColor }]}>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={[s.metricValue, m.label === 'Feasibility' && { fontSize: 12, color: feasColor }]}>{m.value}</Text>
              <Text style={s.metricSub}>{m.sub}</Text>
            </View>
          ))}
        </View>

        {/* How to use */}
        <View style={s.howToBox}>
          <Text style={s.howToTitle}>HOW TO USE THIS PLAN</Text>
          <Text style={s.howToItem}>① Complete each HighScores module before office hours that week — the order is ranked by your diagnostic results (weakest topics first)</Text>
          <Text style={s.howToItem}>② Take each practice test under real test conditions (no phone, timed). Bring your score report to the next office hours session for review</Text>
          <Text style={s.howToItem}>③ If you finish early or need more practice on a topic, use the Question Bank inside each HighScores module for extra drills</Text>
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { width: '8%'  }]}>Wk</Text>
          <Text style={[s.tableHeaderCell, { width: '52%' }]}>Assignment</Text>
          <Text style={[s.tableHeaderCell, { width: '12%' }]}>Section</Text>
          <Text style={[s.tableHeaderCell, { width: '14%' }]}>Est. Time</Text>
          <Text style={[s.tableHeaderCell, { width: '14%' }]}>Done ✓</Text>
        </View>

        {/* Weekly rows */}
        {weeklyAssignments.map((wk, wi) => (
          <View key={wk.week} wrap={false}>
            <Text style={s.weekLabel}>{weekLabel(wk.week, programStartDate)}</Text>
            {wk.assignments.map((a, ai) => {
              if (a.type === 'practice_test') {
                const bannerStyle = a.isFinal ? s.ptBannerFinal : s.ptBanner;
                const color = a.isFinal ? C.red : C.orange;
                return (
                  <View key={ai} style={bannerStyle}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color, marginBottom: 2 }}>
                        {a.isFinal ? '🏁 ' : '📝 '}{a.topic.toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: 7.5, color: C.textMid }}>{a.description}</Text>
                    </View>
                    <Text style={{ fontSize: 7.5, color, fontFamily: 'Helvetica-Bold', marginLeft: 12 }}>{fmtTime(a.estMins)}</Text>
                    <View style={{ width: 32, height: 14, borderWidth: 1, borderColor: color, borderRadius: 2, marginLeft: 12 }} />
                  </View>
                );
              }
              return (
                <View key={ai} style={[s.tableRow, ai % 2 === 0 ? {} : { backgroundColor: C.offWhite }]}>
                  <Text style={[s.tableCell, { width: '8%', color: C.textLight }]}>{ai === 0 ? wk.week : ''}</Text>
                  <View style={{ width: '52%' }}>
                    <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{a.topic}</Text>
                    <Text style={{ fontSize: 7, color: C.blue, fontFamily: 'Helvetica-Oblique' }}>HighScores module</Text>
                  </View>
                  <Text style={[s.tableCell, { width: '12%', color: C.textLight }]}>{a.section}</Text>
                  <Text style={[s.tableCell, { width: '14%' }]}>{fmtTime(a.estMins)}</Text>
                  <View style={{ width: '14%', justifyContent: 'center' }}>
                    <View style={{ width: 18, height: 14, borderWidth: 1, borderColor: C.border, borderRadius: 2 }} />
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function buildGroupPlanPdf(studentData, groupResult) {
  const data = {
    studentName:     studentData.studentName,
    baselineScore:   studentData.baselineScore,
    rwScore:         studentData.rwScore || null,
    mathScore:       studentData.mathScore || null,
    targetScore:     studentData.targetScore,
    targetTestDate:  studentData.targetTestDate || null,
    programStartDate: studentData.programStartDate || null,
    topicSequence:   groupResult.topicSequence,
    weeklyAssignments: groupResult.weeklyAssignments,
    programSummary:  groupResult.programSummary,
  };
  return await renderToBuffer(<GroupDocument data={data} />);
}
