import {z} from "zod";
const row=z.object({rank:z.number().int().positive(),display_name:z.string().min(1),domain:z.enum(["TECHNICAL","CREATIVE","ANALYTICAL","SOCIAL","STRATEGIC"]),level:z.number().int().positive(),score:z.number().int().nonnegative(),streak:z.number().int().nonnegative(),is_user:z.boolean()}).strict();
const region=z.object({country:z.string(),state:z.string(),city:z.string()});
export const LeaderboardResultSchema=z.object({rows:z.array(row).max(50),total:z.number().int().nonnegative(),userRank:z.number().int().nonnegative(),userRow:row.nullable(),participation:z.enum(["opted_out","no_progress","other_category","ranked","not_joined","global_only","outside_region"]),updatedAt:z.string(),region:region.default({country:"",state:"",city:""}),regions:z.array(region).default([])}).strict();
export type LeaderboardResult=z.infer<typeof LeaderboardResultSchema>;
