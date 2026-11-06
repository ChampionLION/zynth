import {z} from "zod";
import {supabase} from "./supabase";
import {PUBLIC_ACCESS} from "./public-access";
const place=z.string().trim().min(1,"Enter the approximate area.").max(80).refine(value=>!/[\u0000-\u001f\u007f]/.test(value),"Use a place name without control characters.");
export const LeaderboardLocationSchema=z.object({country:place,state:place,city:place}).strict();
export type LeaderboardLocation=z.infer<typeof LeaderboardLocationSchema>;
export const LeaderboardMembershipSchema=z.discriminatedUnion("choice",[
 z.object({version:z.literal(1),choice:z.literal("browse"),location:z.null()}),
 z.object({version:z.literal(1),choice:z.literal("global"),location:z.null()}),
 z.object({version:z.literal(1),choice:z.literal("regional"),location:LeaderboardLocationSchema}),
]);
export type LeaderboardMembership=z.infer<typeof LeaderboardMembershipSchema>;
export function parseLeaderboardMembership(value:unknown):LeaderboardMembership|null{const parsed=LeaderboardMembershipSchema.safeParse(value);return parsed.success?parsed.data:null;}
export async function loadLeaderboardMembership(owner:string):Promise<LeaderboardMembership|null>{
 if(PUBLIC_ACCESS){try{return parseLeaderboardMembership(JSON.parse(localStorage.getItem(`zynth:guest-regions:${owner}`)??"null"));}catch{return null;}}
 const {data,error}=await supabase().auth.getUser();if(error||data.user?.id!==owner)throw new Error("Please sign in again.");
 return parseLeaderboardMembership(data.user.user_metadata.zynth_leaderboard);
}
export async function saveLeaderboardMembership(owner:string,value:LeaderboardMembership):Promise<LeaderboardMembership>{
 const clean=LeaderboardMembershipSchema.parse(value);
 if(PUBLIC_ACCESS){localStorage.setItem(`zynth:guest-regions:${owner}`,JSON.stringify(clean));return clean;}
 const {data:user,error:authError}=await supabase().auth.getUser();if(authError||user.user?.id!==owner)throw new Error("Please sign in again.");
 const {data,error}=await supabase().auth.updateUser({data:{zynth_leaderboard:clean}});
 if(error||data.user?.id!==owner)throw new Error("We couldn’t save your choice. Please try again.");
 return clean;
}
