import {z} from "zod";
export const AppearanceSchema=z.object({theme:z.enum(["light","dark","system"]),motion:z.enum(["system","reduced"])}).strict();
export type Appearance=z.infer<typeof AppearanceSchema>;
export const DEFAULT_APPEARANCE:Appearance={theme:"system",motion:"system"};
export function parseAppearance(value:unknown):Appearance{const p=AppearanceSchema.safeParse(value);return p.success?p.data:{...DEFAULT_APPEARANCE};}
export function resolvedTheme(preference:Appearance["theme"],systemDark:boolean):"light"|"dark"{return preference==="system"?(systemDark?"dark":"light"):preference;}
const name=z.string().trim().max(60,"Use at most 60 characters.").refine(v=>!/[\u0000-\u001f\u007f]/.test(v),"Use a name without control characters.");
export const EditableProfileSchema=z.object({display_name:name.refine(v=>v.length>0,"Enter a display name."),character_name:name.nullable(),leaderboard_opt_out:z.boolean()}).strict();
export type EditableProfile=z.infer<typeof EditableProfileSchema>;
