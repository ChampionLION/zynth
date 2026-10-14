// Zynth engine smoke test — run with: node smoke.test.mts
import { mockClassifyOnboarding, mockGenerateQuest, mockGradeResponse } from "./src/lib/llm/mock";
import { buildProfile, ONBOARDING_QUESTIONS, validateOnboardingAnswers } from "./src/lib/engines/onboarding";
import { resolveQuestPlan, todayStr } from "./src/lib/engines/quest";
import { runExploitCheck } from "./src/lib/engines/exploit";
import { runPostGradePipeline } from "./src/lib/engines/pipeline";
import { calculateExpToNext, calculateFinalEXP, checkLevelUp } from "./src/lib/engines/progression";

import { awardXPCards, spendXPCards, spendToken } from "./src/lib/engines/economy";
import { applyPrestige } from "./src/lib/engines/progression";
import { calculateDifficulty } from "./src/lib/engines/quest";
import { buildCompressedContext } from "./src/lib/engines/compression";
import { checkEventHiddenSkills } from "./src/lib/engines/hiddenSkills";
import { detectUserState } from "./src/lib/engines/adaptive";
import { checkAchievements } from "./src/lib/engines/achievements";
import { applyStatDeltas } from "./src/lib/engines/stats";
import { OnboardingResultSchema } from "./src/lib/llm/schemas";
import { getLeaderboard } from "./src/lib/engines/leaderboard";
import { activeWorldChapter, buildWorldMarks, completedMarks } from "./src/lib/engines/markmap";
import { onboardingPrompt } from "./src/lib/llm/prompts";
let failures = 0;
async function main() {
const check = (name: string, cond: boolean, extra?: unknown) => {
  if (cond) console.log(`  ✓ ${name}`);
  else { failures++; console.error(`  ✗ ${name}`, extra ?? ""); }
};

console.log("1. Onboarding classification");
const llmProfile = mockClassifyOnboarding({
  Q1: ["Software Developer"], Q2: ["B", "A"], Q3: ["A"], Q4: ["A"], Q5: ["D"],
});
check("domain assigned", ["ANALYTICAL","TECHNICAL","CREATIVE","SOCIAL","STRATEGIC"].includes(llmProfile.domain), llmProfile.domain);
const vals = [
  llmProfile.stats.focus, llmProfile.stats.consistency,
  llmProfile.stats.adaptability, llmProfile.stats.execution,
  llmProfile.stats.stat_5.value, llmProfile.stats.stat_6.value,
];
const total = vals.reduce((a, b) => a + b, 0);
check("stats in 4–10", vals.every((v) => v >= 4 && v <= 10), vals);
check("stats unique", new Set(vals).size === 6, vals);
check("stats total 42–52", total >= 42 && total <= 52, total);
check("3–5 skills", llmProfile.skills.length >= 3 && llmProfile.skills.length <= 5);

console.log("2. Profile scaffolding");
const profile = buildProfile("test-user-1", "Test User", llmProfile);
check("level 1 / 3 tokens / exp_to_next", profile.level === 1 && profile.tokens === 3 && profile.exp_to_next === calculateExpToNext(1));
check("onboarding_stats frozen copy", JSON.stringify(profile.onboarding_stats) === JSON.stringify(profile.stats));

console.log("3. Quest resolution + generation");
const plan = resolveQuestPlan(profile);
check("first quest is calibration", plan.questType === "calibration");
const questData = mockGenerateQuest(profile, plan.questType, plan.difficulty);
check("quest has title + criteria", !!questData.quest_title && !!questData.success_criteria);
const quest = { ...questData, id: "q1", status: "active" as const, created_at: new Date().toISOString(), date: todayStr() };

console.log("4. Exploit checks");
const fast = runExploitCheck({ profile, response: "short", responseTimeSeconds: 10 });
check("rapid submission → soft_block", fast.severity === "soft_block" && fast.expPenalty === 0.3);
const dupProfile = structuredClone(profile);
dupProfile.quest_history.push({
  quest_id: "x", quest_title: "x", quest_type: "daily", grade: "Good", exp_earned: 9,
  skills_targeted: [], completed_at: new Date().toISOString(),
  response: "I would build a personal knowledge system that connects all my notes together in one place",
});
const dup = runExploitCheck({
  profile: dupProfile,
  response: "I would build a personal knowledge system that connects all my notes together in one place",
  responseTimeSeconds: 200,
});
check("duplicate → hard_block rejected", dup.severity === "hard_block" && dup.rejected);

console.log("5. Grading");
const goodResponse =
  "I've always wanted to build a personal automation hub. Specifically, it would watch my daily patterns because I keep repeating the same tasks. For example, every morning I collect the same three reports. The first piece I'd build is the collector module: it pulls each source, normalizes the data, and produces one summary. My reasoning is that the collector delivers value on day one even before any automation exists.";
const gradeResult = mockGradeResponse({
  quest, response: goodResponse, profile, responseTimeSeconds: 240,
});
check("calibration grades well", ["Good", "Excellent"].includes(gradeResult.grade), gradeResult.grade);
check("behavioral signals present", !!gradeResult.behavioral_signals.response_depth);

console.log("6. EXP math");
check("Excellent base 15", calculateFinalEXP("Excellent", 1) === 15);
check("streak 7 → 1.5×", calculateFinalEXP("Excellent", 7) === 23); // round(15*1.5)
check("challenge 5× type mult", calculateFinalEXP("Good", 1, 1.0, "challenge") === 45);
const need1 = calculateExpToNext(1);
const lvl = checkLevelUp(1, need1 - 5, 10);
check("level up rolls over", lvl.didLevelUp && lvl.newLevel === 2 && lvl.newExp === 5);

console.log("7. Full pipeline");
const result = await runPostGradePipeline({
  profile, quest, gradeResult,
  responseText: goodResponse,
  responseTimeSeconds: 240,
  exploit: { severity: null, flag_type: null, rejected: false, expPenalty: 1.0, strictGrader: false },
  swiftModeUsed: false,
});
check("exp awarded", result.expEarned > 0, result.expEarned);
check("streak = 1", result.profile.streak === 1);
check("history has 1 entry", result.profile.quest_history.length === 1);
check("behavior log has 1 entry", result.profile.behavior_log.length === 1);
check("last_quest_date = today", result.profile.last_quest_date === todayStr());
if (gradeResult.grade === "Excellent") {
  check("first excellent milestone", result.profile.memory.milestones.some((m) => m.type === "first_excellent"));
  check("achievement Sharp unlocked", result.profile.achievements_unlocked.includes("first_excellent"));
}

console.log("8. Streak milestone at day 7");
let p7 = structuredClone(result.profile);
// simulate 6 more good days
for (let d = 1; d <= 6; d++) {
  const date = new Date(Date.now() + d * 86400_000).toISOString().slice(0, 10);
  p7.last_quest_date = new Date(Date.now() + (d - 1) * 86400_000).toISOString().slice(0, 10);
  p7.streak = d;
}
p7.streak = 6;
p7.last_quest_date = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
const q7 = { ...mockGenerateQuest(p7, "daily", 1), id: "q7", status: "active" as const, created_at: new Date().toISOString(), date: todayStr() };
const g7 = mockGradeResponse({ quest: q7, response: goodResponse, profile: p7, responseTimeSeconds: 200 });
const r7 = await runPostGradePipeline({
  profile: p7, quest: q7, gradeResult: g7,
  responseText: goodResponse, responseTimeSeconds: 200,
  exploit: { severity: null, flag_type: null, rejected: false, expPenalty: 1.0, strictGrader: false },
  swiftModeUsed: false,
});
check("streak reached 7", r7.profile.streak === 7, r7.profile.streak);
check("streak milestone event queued", r7.events.some((e) => e.kind === "streak_milestone"));
check("token awarded (3→4)", r7.profile.tokens === 4, r7.profile.tokens);
check("1.5× multiplier applied", r7.streakMultiplier === 1.5);
check("week_forged achievement", r7.profile.achievements_unlocked.includes("week_forged"));

console.log("9. Engine regression checks");
const wallet=structuredClone(profile); awardXPCards(wallet,10,"old");
check("spend cards",spendXPCards(wallet,6) && wallet.xp_cards===4);
check("ledger consumes spent grants",wallet.xp_card_log.reduce((n,e)=>n+e.count,0)===4);
wallet.xp_card_log[0].expires_at=new Date(0).toISOString(); awardXPCards(wallet,3,"new");
check("expiry preserves fresh grants",wallet.xp_cards===3);
check("negative spends rejected",!spendXPCards(wallet,-1) && !spendToken(wallet,-1));
check("difficulty bounded",calculateDifficulty(1000)===5);
const veteran=structuredClone(profile); veteran.level=100; const reborn=applyPrestige(veteran); reborn.level=100; const twice=applyPrestige(reborn);
check("prestige bonus accumulates",twice.stats.focus===profile.onboarding_stats.focus+4);
check("prestige ledger respects cap",twice.xp_cards===twice.xp_card_log.reduce((n,e)=>n+e.count,0));
const resilient=structuredClone(result.profile); resilient.quest_history=[0,1,2,3].map(n=>({...result.profile.quest_history[0],quest_id:String(n),grade:n===3?"Excellent" as const:"Fail" as const}));
check("resilience event detected",checkEventHiddenSkills(resilient).includes("Resilience"));
check("achievements do not repeat",checkAchievements(result.profile).length===0);
const returning=structuredClone(profile); returning.last_active=new Date(Date.now()-10*86400_000).toISOString();
check("absence reaches adaptive engine",detectUserState(returning).state==="returning");
returning.continuous_profile_answers.push({question:"Q",category:"ambition",answer_key:"A",answer_label:"Build something",signals_mined:"",answered_at:new Date().toISOString()});
check("profiling reaches prompt context",JSON.stringify(buildCompressedContext(returning,"quest_generation")).includes("Build something"));
let duplicateRejected=false;
try { await runPostGradePipeline({profile:result.profile,quest,gradeResult,responseText:goodResponse,responseTimeSeconds:240,exploit:{severity:null,flag_type:null,rejected:false,expPenalty:1,strictGrader:false},swiftModeUsed:false}); } catch {duplicateRejected=true;}
check("duplicate grading rejected",duplicateRejected);
console.log("10. Cross-engine boundaries");
const floor=structuredClone(profile); applyStatDeltas(floor,{focus:-100,consistency:-100,adaptability:-100,execution:-100});
check("stat floors preserved",floor.stats.focus===profile.onboarding_stats.focus && floor.stats.execution===profile.onboarding_stats.execution);
check("onboarding schema enforces unique stats",!OnboardingResultSchema.safeParse({...llmProfile,stats:{...llmProfile.stats,focus:llmProfile.stats.execution}}).success);
const signalled=structuredClone(llmProfile); signalled.skills[0].level=100; signalled.skills[0].exp=999;
check("app owns starting skill math",buildProfile("x","X",signalled).skills[0].level===1);
const privateProfile=structuredClone(profile); privateProfile.leaderboard_opt_out=true;
const privateBoard=await getLeaderboard(privateProfile,"global","all");
check("leaderboard opt-out respected",privateBoard.userRank===0 && !privateBoard.rows.some(r=>r.is_user));
const actualResilience=structuredClone(profile); actualResilience.quest_history=resilient.quest_history.slice(0,3);
const resilienceResult=await runPostGradePipeline({profile:actualResilience,quest:{...quest,id:"resilience-new"},gradeResult:{...gradeResult,grade:"Excellent"},responseText:goodResponse,responseTimeSeconds:240,exploit:{severity:null,flag_type:null,rejected:false,expPenalty:1,strictGrader:false},swiftModeUsed:false});
check("pipeline discovers resilience on the correct submission",resilienceResult.events.some(e=>e.kind==="hidden_skill"&&e.skill==="Resilience"));
check("memory context gated until level 20",buildCompressedContext(profile,"quest_generation").memory_context===null);
const experienced=structuredClone(result.profile); experienced.level=20;
check("memory connected at level 20",buildCompressedContext(experienced,"quest_generation").memory_context!==null);
console.log("11. Aspiration-first onboarding");
const customAnswers={Q1:["I want to become a documentary filmmaker"],Q2:["A","C"],Q3:["C"],Q4:["D"],Q5:["B"]};
const customResult=mockClassifyOnboarding(customAnswers);
check("custom aspiration is preserved",customResult.profession==="a documentary filmmaker");
check("goal anchors the quest domain",customResult.domain==="CREATIVE");
const differentGoal=mockClassifyOnboarding({...customAnswers,Q1:["Software Developer"]});
check("changing destination does not invent a different work style",differentGoal.learning_style===customResult.learning_style && differentGoal.stats.focus===customResult.stats.focus && differentGoal.stats.consistency===customResult.stats.consistency && differentGoal.stats.adaptability===customResult.stats.adaptability && differentGoal.stats.execution===customResult.stats.execution);
const customProfile=buildProfile("custom-user","Custom User",customResult,customAnswers.Q1[0]);
check("written direction persisted",customProfile.aspiration==="a documentary filmmaker");
check("aspiration reaches quest context",buildCompressedContext(customProfile,"quest_generation").aspiration==="a documentary filmmaker");
check("calibration acknowledges direction",mockGenerateQuest(customProfile,"calibration",1).description.includes("documentary filmmaker"));
check("exactly five onboarding steps",ONBOARDING_QUESTIONS.length===5 && ONBOARDING_QUESTIONS[0].kind==="aspiration");
check("live prompt uses the actual new questions",onboardingPrompt(JSON.stringify(customAnswers)).includes(ONBOARDING_QUESTIONS[1].prompt) && !onboardingPrompt("{}").includes("$10,000"));
let invalidRejected=false;try{validateOnboardingAnswers({...customAnswers,Q1:["  "]});}catch{invalidRejected=true;}
check("blank aspiration rejected",invalidRejected);
invalidRejected=false;try{validateOnboardingAnswers({...customAnswers,Q3:["F"]});}catch{invalidRejected=true;}
check("obsolete option keys rejected",invalidRejected);
invalidRejected=false;try{validateOnboardingAnswers({...customAnswers,Q2:["A","A"]});}catch{invalidRejected=true;}
check("duplicate selections rejected",invalidRejected);
let foundationsValid=true;
for (const q2 of ONBOARDING_QUESTIONS[1].options) for (const q3 of ONBOARDING_QUESTIONS[2].options) for (const q4 of ONBOARDING_QUESTIONS[3].options) for (const q5 of ONBOARDING_QUESTIONS[4].options) {
 const candidate=mockClassifyOnboarding({Q1:["Still exploring"],Q2:[q2.key],Q3:[q3.key],Q4:[q4.key],Q5:[q5.key]});
 if (!OnboardingResultSchema.safeParse(candidate).success) foundationsValid=false;
}
check("all 500 primary scenario combinations produce valid profiles",foundationsValid);
console.log("12. Shared world-map progression");
const firstMap=buildWorldMarks(profile,0);
check("new journey has one current checkpoint",firstMap.filter(m=>m.state==="current").length===1 && firstMap[0].state==="current");
check("mission landmarks at marks seven and fourteen",firstMap[6].isMission && firstMap[13].isMission);
check("map geometry spans both axes",new Set(firstMap.map(m=>m.x)).size>10 && new Set(firstMap.map(m=>m.y)).size>8);
const dayProfile=structuredClone(result.profile);
dayProfile.quest_history.push({...dayProfile.quest_history[0],quest_id:"same-day"});
dayProfile.quest_history.push({...dayProfile.quest_history[0],quest_id:"failed-day",grade:"Fail",completed_at:"2000-01-01T12:00:00Z"});
check("attempts and same-day retries do not add marks",completedMarks(dayProfile).length===1);
const doneMap=buildWorldMarks(dayProfile,0);
check("completed day fills checkpoint and opens next tomorrow",doneMap[0].state==="completed" && doneMap[1].state==="tomorrow");
check("checkpoint retains quest detail",doneMap[0].entry?.quest_title===quest.quest_title);
const longJourney=structuredClone(profile);
longJourney.quest_history=Array.from({length:14},(_,i)=>({...result.profile.quest_history[0],quest_id:String(i),completed_at:new Date(Date.UTC(2020,0,i+1,12)).toISOString()}));
check("fourteen days advance to the next world chapter",activeWorldChapter(longJourney)===1 && buildWorldMarks(longJourney)[0].number===15);
check("earlier chapters remain completed",buildWorldMarks(longJourney,0).every(m=>m.state==="completed"));
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
}
main();
