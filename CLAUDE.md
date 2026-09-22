# StudyCore Gameplan Generator — System Reference

## Table of Contents
- [What this app does](#what-this-app-does)
- [Tech stack](#tech-stack)
- [Key files](#key-files)
- [Routing engine logic](#routing-engine-logic)
- [4-Phase program structure](#4-phase-program-structure)
- [Session types](#session-types)
- [PDF outputs](#pdf-outputs)
- [HighScores API integration](#highscores-api-integration)
- [Deployment](#deployment)

---

## What this app does

Generates a personalised SAT study gameplan for a student based on their diagnostic results. Produces three PDFs (Tutor Gameplan, Internal Brief, Student Plan) plus a Google Sheets Mastery Tracker. Entry point is `app/page.js`.

**Two modes:**
- **New Student** — upload a diagnostic PDF or pull topic accuracy data from the HighScores platform
- **Guarantee Recovery** — student missed their target; uses score report + platform session data to build a recovery plan with guaranteed free sessions

---

## Tech stack

- **Next.js 14** App Router, deployed on Vercel (Hobby plan, 120s serverless timeout)
- **`@react-pdf/renderer`** for PDF generation (JSX → PDF buffer)
- **NDJSON streaming** from `/api/generate` so the UI shows live progress
- **Supabase** (`supabase-coffee-bell`) for gameplan history storage (`lib/db.js`)
- **Google Sheets API** for Mastery Tracker creation (`lib/google-sheets.js`)
- **HighScores public GraphQL API** for pulling student topic accuracy data

---

## Key files

| File | Purpose |
|------|---------|
| `app/page.js` | Main UI — 3-step form (Upload Diagnostic → Program Details → Generate) |
| `app/api/generate/route.js` | Streaming POST endpoint — orchestrates routing → narratives → PDFs → tracker → DB |
| `lib/routing-engine.js` | Core logic — topic selection, 4-phase plan building, session sequencing |
| `lib/pdf-student-plan.js` | Student-facing PDF — session schedule with phase headers, blurbs, homework |
| `lib/pdf-gameplan-new.js` | Tutor-facing PDF — topic sequence, Notion links, gate targets |
| `lib/pdf-internal-plan.js` | Internal brief PDF — pricing, guarantee status, session breakdown |
| `lib/gameplan-rules.js` | Rule-based narrative generation (no Claude API call) |
| `lib/topic-data.js` | `PLATFORM_TOPICS` mapping (platform name → curriculum topic) + `CURRICULUM_TOPICS` with tier/section/domain |
| `app/api/highscores-students/route.js` | Bulk student topic accuracy via HighScores public API |
| `app/api/gameplans/route.js` | GET history of generated gameplans from Supabase |

---

## Routing engine logic

**File:** `lib/routing-engine.js` — `computeProgram(diagnosticEntries, studentInfo)`

### Input
```js
diagnosticEntries = [{ platformName, qs, mastery }]   // from PDF parse or HighScores
studentInfo = {
  baselineScore, targetScore,
  sessionFrequency,   // '1x' | '2x' | '3x'
  blanks,             // questions left blank on diagnostic
  targetTestDate,     // 'YYYY-MM-DD'
  programStartDate,   // 'YYYY-MM-DD' (defaults to today)
  weeklySchedule,     // [{ week, sessions, hoursPerSession }] — custom per-week schedule
  weeksOverride,      // manual week count, bypasses date-based calculation
}
```

### Step-by-step

1. **Calculate weeks/sessions available** — from `targetTestDate - programStartDate`. `weeksOverride` takes precedence over date math. Custom `weeklySchedule` overrides fixed session counts with slot-based counts (`floor(sessions × hoursPerSession)` per week; 2 × 1.5h = 3 slots).

2. **Aggregate misses by curriculum topic** — maps `platformName` → `curriculumTopic` via `PLATFORM_TOPICS`, accumulates miss counts and mastery.

3. **Proportional interleaved topic selection** — always picks the highest-miss topic from whichever section (R&W or Math) is currently underrepresented relative to its share of total misses. Prevents all-Math plans when Math diagnostic is weak.

4. **Minimum topics floor** — `minTopics = min(20, max(3, ceil(targetGain / 15)))`. Prevents a single-topic plan when one topic happens to have enough raw misses to satisfy the gain math but the student clearly needs more work (e.g. +130pt student needs at least 9 topics).

5. **Break condition** — only breaks early when `cumulativeMisses × 0.5 ≥ missesToConvert` AND `selectedTopics.length ≥ minTopics`.

6. **Speed flagging** — topics where `avgTimeSecs > 85` and mastery is not Foundational get `needsSpeedFocus: true`. Tutor is cued to run timed drills from session 1.

7. **WAE insertion** — Wrong Answer Elimination session inserted after 5 R&W topics are taught.

8. **Pacing session** — inserted if student left 5+ blanks on diagnostic.

9. **`buildWeeklyPlan`** — assembles all sessions into the 4-phase structure (see below), numbers them, assigns week numbers.

### Constants
```js
POINTS_PER_CORRECT = 10          // SAT score points per correct question gained
SESSIONS_PER_TOPIC = 2           // Phase 1 (Learn It) + Phase 2 (Speed Review)
SHARED_PHASE_OVERHEAD = 0.43     // legacy; not currently used in slot math
CONVERSION_RATE = 0.5            // share of missed questions a student can realistically convert
WAE_AFTER_RW_TOPICS = 5         // insert WAE after this many R&W topics
SLOW_THRESHOLD_SECS = 85        // above this avg time/question → speed-flagged
```

---

## 4-Phase program structure

Phases are **time-proportional** based on `weeksUntilTest`. Each phase ends with a full-length practice test.

| Phase | Weeks allocation | Purpose | Ends with |
|-------|-----------------|---------|-----------|
| **Phase 1 — Build** | 40% of weeks | Teach topic batch 1: Learn It + Speed Review per topic, Error Analysis every 3 topics, WAE | Practice Test #1 |
| **Phase 2 — Refine** | 25% of weeks | New topic batch + Spaced Reviews of Phase 1 topics filling leftover budget | Practice Test #2 |
| **Phase 3 — Consolidate** | 20% of weeks | Remaining new topics + High-Difficulty Mixed Practice sets filling leftover budget | Practice Test #3 |
| **Phase 4 — Finalise** | 15% of weeks, min 2 wks | Fixed template: [extra Retention Sweeps if budget] → Weak Point Elimination → Timed R&W Section → Timed Math Section | **Final Practice Test** |

### Phase week calculation (when `weeksUntilTest ≥ 4`)
```js
p4W = max(2, round(weeksUntilTest × 0.15))
rem = weeksUntilTest - p4W
p1W = max(1, round(rem × 0.50))
p2W = max(1, round(rem × 0.31))
p3W = max(1, rem - p1W - p2W)
```

**Example — 24 weeks:** Phase 1: 10 wks, Phase 2: 6 wks, Phase 3: 4 wks, Phase 4: 4 wks
**Example — 12 weeks:** Phase 1: 5 wks, Phase 2: 3 wks, Phase 3: 2 wks, Phase 4: 2 wks
**No test date:** Topics split evenly across phases 1/2/3 as equal thirds; Phase 4 appended with fixed template.

### Topic capacity per phase
Each topic needs 2 content sessions + ~0.33 error analysis sessions. Formula:
```js
function topicsCapacity(slots) {
  let avail = slots - 1;  // reserve 1 slot for phase-end practice test
  let n = 0, errBuf = 0;
  while (avail >= 2) {
    avail -= 2; n++; errBuf++;
    if (errBuf >= 3) { avail -= 1; errBuf = 0; }
  }
  return n;
}
```

---

## Session types

Every session object carries: `topic`, `phase`, `gate`, `gateTarget`, `section`, `homework`, `sessionBlurb`, `isCheckpoint`, `isFinalPracticeTest`, `programPhase`, `needsSpeedFocus`.

| `phase` value | PDF label | Color | Description |
|--------------|-----------|-------|-------------|
| `Phase 1` | Learn It | Blue | Concept intro + think-aloud + 10-question untimed check (9/10 gate) |
| `Phase 1` + `needsSpeedFocus` | Learn It ⚡ Speed | Blue | Same but timed from question 1; pace coaching throughout |
| `Phase 1` + `gate: 'WAE'` | Wrong Answer Elimination | Blue | 4 trap types + 20-choice labelling exercise |
| `Phase 2` | Speed Review | Orange | 2–3 back-to-back 10-question timed sets; 90%+ gate |
| `Phase 3` | Error Analysis | Green | Label errors: Conceptual Gap / Rushing / Reading / Trap Answer |
| `Spaced Review` | Spaced Review | Green | 8–10 questions on a Phase 1 topic; confirms 21-day retention |
| `Mixed Practice` | Mixed Practice | Orange | 22-question hard mixed set spanning all taught topics |
| `Pacing` | Pacing & Strategy | Navy | Triage system intro; runs only if student blanked 5+ questions |
| `Phase 4` | Practice Test Review | Navy | Full score-report review; maps errors to topics; re-ranks plan |
| `Phase 4` + `isFinalPracticeTest` | Final Practice Test | Red | Benchmark session 2 weeks before SAT |
| `Phase 5` | Weak Point Elimination | Red | 15–20 targeted questions on #1 error pattern from Phase 3 test |
| `Timed Practice` | Timed Section | Navy | Full 54-question R&W or 44-question Math section under time |

### Session blurbs
Every session carries a `sessionBlurb` — 1–2 sentences describing what the session actually looks like. Rendered in italic below the topic name in the Student Plan PDF.

### Homework
Every session carries a `homework` field — specific assignment the student completes before the next session. Rendered in the "Before-Session Homework" column of the session schedule.

---

## PDF outputs

### Student Plan (`lib/pdf-student-plan.js`)
- Page 1: Score cards, topic summary by section, "How it works" steps, weekly homework schedule, 3-checkpoint explainer
- Page 2+: Session schedule with **Program Phase headers** (navy bar showing phase name, topic count, week budget, subtitle) and **End-of-Phase banners** (full-width orange/red callout explaining the practice test requirement before each Phase 4 session)

**Phase header format:** `PHASE 1 — BUILD · 8 topics  (10 wk)`
**Phase subtitle:** `Learn each topic · 9/10 untimed gate · speed drill`

### Tutor Gameplan (`lib/pdf-gameplan-new.js`)
Topic sequence table with Notion lesson links, gate targets, tier levels, miss counts, projected score gain per topic.

### Internal Brief (`lib/pdf-internal-plan.js`)
Pricing table, guarantee status, paid/free session breakdown, topic list with section breakdown.

---

## HighScores API integration

**Endpoint:** `https://api.highscores.ai/public/graphql`
**Auth:** `X-API-Key` header with `HISCORES_API_KEY` env var
**Query:**
```graphql
{
  studentReport(limit: 100) {
    student { id name }
    topicAccuracy { topicName correct total accuracyPercent }
    assignmentCompletion { total completed completionPercent }
  }
}
```

**Route:** `app/api/highscores-students/route.js` — GET, returns sorted student list.

**UI flow:** In Step 1 (Upload Diagnostic), switch to "Pull from Platform". Students load automatically on tab open. Search filters client-side. Selecting a student maps `topicAccuracy` → `diagnosticEntries` (`platformName = topicName`, `qs = total`, `mastery = accuracyPercent`).

**Topic name casing:** HighScores returns inconsistent casing (e.g. "Boundaries" vs "Boundaries (Punctuation)"). The `PLATFORM_TOPICS` table in `lib/topic-data.js` handles the mapping — if a HighScores topic name doesn't match, it won't appear in the plan. Extend `PLATFORM_TOPICS` if new topic names appear.

---

## Deployment

- **Git remotes with push access:** `studycorez` and `studycorez1` (both point to GitHub)
- **Branch:** `claude/build-studycore-app-cyYKz` — Vercel deploys this branch automatically
- **Always push to both remotes:**
  ```bash
  git push studycorez claude/build-studycore-app-cyYKz
  git push studycorez1 claude/build-studycore-app-cyYKz
  ```
- **Env vars required in Vercel:** `HISCORES_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (for diagnostic PDF parsing)
- **Serverless timeout:** `export const maxDuration = 120` on the generate route — do not remove

---

## What was built (Sep 2026 session)

### Routing engine
- Minimum topics floor (`ceil(targetGain/15)`, min 3, max 20) — prevents single-topic plans for large gaps
- Speed flagging (`avgTimeSecs > 85` + non-Foundational) → `needsSpeedFocus` on topic and session
- 4-phase time-proportional structure replacing old "every 6 topics" trigger
- Custom weekly schedule (`weeklySchedule` array with per-week session count + hours) → slot-based capacity
- Manual weeks override (`weeksOverride`) bypasses date-based calculation when program started earlier

### Student Plan PDF
- Program Phase headers (navy bar: phase name, topic count, week budget, purpose subtitle)
- End-of-phase banners (full-width callout before each practice test session explaining what to do and bring)
- Session blurbs (italic text below topic name describing what that lesson actually looks like)
- "Before-Session Homework" column in the schedule table
- Session types: Spaced Review, Mixed Practice, Timed Practice, Weak Point Elimination, Final Practice Test

### UI (app/page.js)
- HighScores platform pull replacing session-cookie approach
- Manual R&W score + Math score fields in Program Details (Step 2)
- Weekly schedule editor (per-week grid: sessions toggle 0/1/2/3, duration 1h/1.5h/2h, totals bar)
- Manual weeks override input in the pacing box with Reset link
- Score breakdown summary card (purple) when R&W + Math are entered
