# Learning-first quests and provided mission cases

Owner revision: 3 November 2026 (Africa/Lagos).

## Product rule

Daily quests teach useful knowledge toward the chosen direction. They should not repeatedly demand a performance the user has never been taught. Some days combine two short lessons and a small check. Missions carry the main assessments.

In every assessment, **Zynth supplies the problem**: a scenario, sample data, constraints and any test inputs needed. The learner diagnoses, solves and checks that problem. The task must not be to invent a problem and then invent its solution. No outside research, software, publishing or personal disclosure is required.

This supersedes the old single-prompt-only daily format and the historical v1 statement that the product is not a learning platform, specifically for quest delivery. The original blueprint remains preserved. Existing numerical progression, accounts and historical records remain applicable.

## Learning format

New non-mission quests have an optional-on-historical-records `learning` object containing an objective, one or two lessons, and one reinforcement check. Each lesson includes an actual explanation and worked example. Reading a lesson requires no typed response or individual grade. The UI shows the lessons above the check and leaves them available while answering.

The first calibration, supportive weakness/re-entry quests and current low-energy sessions use one lesson. Other learning days alternate one and two lessons using the count of successful non-mission completions. Challenge and prestige quests teach before applying; their new generated content follows the same learning format. Existing prestige quests with answer-required steps remain usable as issued.

The check supplies a small problem and two or three distinct options. The user can select a choice or type/speak “Option B”, then optionally explain. Changing the choice preserves their explanation. Choices, explanations and voice transcripts use the existing account-scoped draft flow. Corrective feedback appears as **Practice complete**, without making a short learning day feel like a major exam.

The current authored fallback contains **35 foundation units, 70 lesson definitions and 35 reinforcement checks across five domains**, plus a supplied mission case per domain. It is a finite foundation bank, not a complete profession curriculum or an endless source of new material. The live generation prompt receives the chosen direction, actual skills, adaptive context and recent taught topics to generate relevant extensions; invalid output falls back to authored content. No model-provider configuration or paid service was activated by this change.

## Missions

Seven qualifying completions still unlock a mission under the existing policy. A new mission has a concrete `scenario`, two or three linked answer-required steps and optional `assessment_topics`. The supplied case stays visible across every step. Tasks ask the user to understand the case, solve it within its stated constraints and check the solution against supplied examples or outcomes.

Authored cases include repairing a booking flow, correcting a delivery analysis, revising a supplied announcement, resolving a room-change message and choosing a queue intervention within a budget. Existing accounts without a recorded teaching history receive a short reference with the case, rather than a claim that they have already learned the material.

Lesson titles are saved in `quest_history.learning_topics` after completion. Generation context includes the last seven successful non-mission entries and their topics. These are records of delivered learning activities, not proof of mastery. Live mission output cannot claim assessment topics absent from that recent record; unrecorded legacy backgrounds use a reference instead.

## Generation and grading boundaries

The shared generation guard requires the planned lesson count for learning days, prohibits answer-required teaching steps, requires a provided mission scenario, checks ordered mission steps and rejects explicit instructions to invent a replacement problem. Targeted skills must come from the existing profile. Lesson titles and option keys/labels must be distinct, and the answer key must identify an available option. Both browser and trusted server generation use the same guard. A bounded 2,600-token output budget accommodates actual teaching content.

The trusted completion service reads the saved learning check, not a client-supplied answer key or grade. A correct selection produces **Good**; an incorrect but valid attempt produces **Basic** with the explanation and better answer. An unrecognised reply asks the user to choose an option and does not commit a result. The model is not asked to judge prose length for these checks. This is open-book formative practice, not a secret examination.

Recognised choices from saved learning checks are excluded from prose-length, rapid-writing and repeated-option heuristics. Owner authentication, action rate limits, one active persisted quest, transaction leases, revision checks and completion idempotency remain enforced. The application still owns EXP/reward calculations, and the existing Basic/Good/Excellent mission-credit policy is unchanged. Mission and historical free-response grading retain their existing provider/practice-mode boundary; practice-mode prose grading is not semantic proof that a complex solution is correct.

The new data lives in existing quest/history JSON. **No database migration is needed.** Active saved quests and drafts are not silently replaced. The new format applies when a new quest is generated. Existing historical content continues to load through its original completion path.

## Verification

- `npm run test:learning`: all five domain banks, seven distinct first-cycle topics each, one/two-lesson cadence, bounded schemas, provided mission cases, topic context, concise answers, corrective feedback, explanation preservation and legacy behavior.
- `npm test`: existing engine, account, mission-policy, persistence and voice lifecycle suites. Free-response fixtures explicitly represent older issued quests.
- `npm run test:journey`: existing trusted transactions/permissions plus stored formative grading without calling the prose model, invalid-choice rejection, topic persistence and replay without duplicate rewards.
- `scripts/verify-learning-quests.cjs`: actual phone-width UI against disposable local accounts, including two lessons, worked examples, choice and voice replies, draft refresh, correction feedback, saved topics, supplied case visibility and mission-step restoration. Speech is synthetic; live speech accuracy and physical Android behavior remain separate.
- Web lint and TypeScript checks; visual inspection of lesson, feedback and mission screens.

The Android shell loads these web changes from the existing site. The new app icon is packaged separately in the APK. See [Android installation and limitations](ANDROID_APP.md).

## 5 November 2026 — Lesson visibility and readiness correction

Supersedes the earlier seven-completion policy: mission eligibility now uses successful practice across at least three distinct taught concepts, at least two understood checks among the last three recorded learning checks, and an understood latest check. This is concept coverage/readiness, not seven days or seven quests. Existing active missions/retries and earned progress remain valid; a completed mission starts the next learning cycle. Editable offline additional-study metadata does not grant mission eligibility. No database migration is required: the trusted server derives readiness from stored history.

Overview now shows actual teaching and a worked example above the quest card, with a direct Continue this lesson action. New learning quests are labelled as lessons; older unfinished tasks are labelled Continue saved quest. Saved drafts are retained. Learning is also directly accessible while an older task remains unfinished.

Focused readiness checks and TypeScript passed; broader regression fixtures for the superseded seven-credit policy are deferred to the dedicated testing day. Weighted roadmap remains 38/100. Publication follows the existing authorized release workflow.

## 5 November 2026 — Unified daily lessons and transparent caching

Owner correction: the daily quests themselves are the lessons. Removed the separate Overview lesson panel, extra study track, alternate library UI, mode banner and links to an offline experience. Older non-mission daily quests now convert to teaching plus a small check through the trusted service, retaining their IDs/drafts and archiving the previous definition. Missions remain the substantial assessments and use readiness rather than a calendar quota.

The normal application routes and account snapshot are cached. Three upcoming server-prepared daily quest definitions and the relevant mission case are recorded durably, activated through the same quest flow, and replayed through trusted completion after reconnection. The normal feedback screen handles cached formative checks. Profile edits, energy choices, draft/presentation receipts and previously fetched ranking snapshots use the same UI and synchronize quietly. No migration is required. Prior separate-library implementation and its acceptance notes are superseded.

Focused acceptance: normal Overview/quest/grade pages, same lesson identity after disconnected cold reload, local check feedback, one automatic saved-answer submission and three upcoming definitions passed against disposable accounts. Cache hydration/reconnection checks, TypeScript, lint and production compilation passed. Wider multi-date reward/streak reconciliation, distributed races and physical Android acceptance remain for the dedicated testing day. Weighted roadmap remains 38/100. Publication follows the existing authorized release workflow.
