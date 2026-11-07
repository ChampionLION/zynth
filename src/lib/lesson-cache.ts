import type {Profile,Quest} from "./types";
import type {AccountUser} from "./account-flow";
import type {PendingOutcome} from "./journey-contract";
import {missionProgress} from "./engines/quest-cycle";
export interface LessonPack {key:string;policy?:number;lessons:{quest:Quest;ordinal:number}[];mission?:Quest}
export interface SavedJourney {user:AccountUser;profile:Profile;activeQuest:Quest|null;mode:"legacy"|"trusted";pendingOutcome:PendingOutcome|null;pack:LessonPack|null}
export interface SavedReply {quest:Quest;responseText:string;packKey?:string;gradeSeen:boolean;eventCursor:number}
const key=(owner:string)=>`zynth:journey-cache:v2:${owner}`;
export function readJourneyCache(owner:string):SavedJourney|null {try{const value=JSON.parse(localStorage.getItem(key(owner))??"null") as SavedJourney;return value?.user.id===owner&&value.profile.user_id===owner?value:null;}catch{return null;}}
export function saveJourneyCache(value:SavedJourney){localStorage.setItem(key(value.user.id),JSON.stringify(value));}
export function savedReplies(owner:string):SavedReply[]{try{return JSON.parse(localStorage.getItem(`${key(owner)}:replies`)??"[]");}catch{return [];}}
export function saveReplies(owner:string,replies:SavedReply[]){localStorage.setItem(`${key(owner)}:replies`,JSON.stringify(replies));}
export function nextCachedLesson(owner:string,profile:Profile):Quest|null {
 const cache=readJourneyCache(owner),done=new Set([...profile.quest_history.map(q=>q.quest_id),...savedReplies(owner).map(q=>q.quest.id)]);
 // Refresh older scheduled/strength-only packs when connected; keep them usable
 // until a new buffer can be received on an already-disconnected installation.
 if(cache?.pack?.policy!==3&&typeof navigator!=="undefined"&&navigator.onLine)return null;
 if(cache?.pack?.mission&&missionProgress(profile).eligible&&!done.has(cache.pack.mission.id))return cache.pack.mission;
 return cache?.pack?.lessons.find(l=>l.ordinal===profile.quest_history.filter(q=>q.quest_type!=="mission").length&&!done.has(l.quest.id))?.quest??null;
}
export function clearJourneyCache(owner:string){localStorage.removeItem(key(owner));localStorage.removeItem(`${key(owner)}:replies`);}
