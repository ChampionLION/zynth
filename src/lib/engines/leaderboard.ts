// Ranking and participation details are read directly from Supabase.
import type { Domain, Profile } from "../types";
import { isLive, supabase } from "../db";
import {LeaderboardResultSchema,type LeaderboardResult} from "../leaderboard-result";
export type Scope = "local" | "state" | "national" | "global";
export type Category = "all" | Domain;
export type LeaderboardRegion={country:string;state:string;city:string};
export const LEADERBOARD_PAGE_SIZE=25;
export async function getLeaderboard(profile:Profile,scope:Scope,category:Category,offset=0,signal?:AbortSignal,region?:LeaderboardRegion):Promise<LeaderboardResult>{
 if(!isLive())return {rows:[],userRank:0,userRow:null,total:0,participation:profile.leaderboard_opt_out?"opted_out":"not_joined",updatedAt:new Date().toISOString(),region:{country:"",state:"",city:""},regions:[]};
 let request=supabase().rpc("get_leaderboard",{p_scope:scope,p_category:category,p_offset:offset,p_limit:LEADERBOARD_PAGE_SIZE,p_country:region?.country||null,p_state:region?.state||null,p_city:region?.city||null});
 if(signal)request=request.abortSignal(signal);
 const {data,error}=await request;
 if(error)throw new Error("We couldn’t load these rankings. Please try again.");
 const parsed=LeaderboardResultSchema.safeParse(data);
 if(!parsed.success)throw new Error("We couldn’t read these rankings. Please try again.");
 return parsed.data;
}

export function displayName(profile: Profile): string {
  const parts = profile.display_name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[parts.length-1][0].toUpperCase()}.`;
  return parts[0] || "Wayfarer";
}

// ── Profession evolution via leaderboard rank ────────────────────

export function checkProfessionEvolution(
  profile: Profile,
  userRank: number,
  total: number
): { from: string; to: string } | null {
  if (userRank === 0 || total === 0) return null;
  const pct = userRank / total;
  const prof = profile.profession;
  if (/^(Senior|Lead|Principal|Director|Creative Director)/.test(prof)) {
    // already evolved at least once; only evolve further at 5%
    if (pct <= 0.05 && /^Senior/.test(prof)) {
      return { from: prof, to: prof.replace(/^Senior/, "Principal") };
    }
    return null;
  }
  if (pct <= 0.05) return { from: prof, to: `Principal ${prof}` };
  if (pct <= 0.1) return { from: prof, to: `Lead ${prof}` };
  if (pct <= 0.25) return { from: prof, to: `Senior ${prof}` };
  return null;
}
