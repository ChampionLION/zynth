import {z} from "zod";
export const AvatarSchema=z.object({
 version:z.literal(1),skin:z.enum(["porcelain","sand","copper","umber","ebony"]),
 hair:z.enum(["crop","waves","coils","shaved"]),hairColor:z.enum(["ink","chestnut","silver","auburn"]),
 outfit:z.enum(["wayfarer-coat","studio-knit","field-jacket"]),palette:z.enum(["moss","ochre","slate","plum"]),
 background:z.enum(["atrium","grove","workshop"]),accessory:z.null(),aura:z.null(),
}).strict();
export type Avatar=z.infer<typeof AvatarSchema>;
export const DEFAULT_AVATAR:Avatar={version:1,skin:"copper",hair:"waves",hairColor:"ink",outfit:"wayfarer-coat",palette:"moss",background:"atrium",accessory:null,aura:null};
export const SKIN_COLORS={porcelain:"#e8c5ac",sand:"#d4a17c",copper:"#b97850",umber:"#845338",ebony:"#4e342b"};
export const HAIR_COLORS={ink:"#292c29",chestnut:"#694735",silver:"#d0cec2",auburn:"#955138"};
export const OUTFIT_COLORS={moss:"#52654d",ochre:"#ae7843",slate:"#526579",plum:"#795768"};
export const FREE_OUTFITS=[{id:"wayfarer-coat",name:"Wayfarer coat"},{id:"studio-knit",name:"Studio knit"},{id:"field-jacket",name:"Field jacket"}] as const;
export const AVATAR_SLOTS=["outfit","accessory","aura"] as const;
export function parseAvatar(value:unknown):Avatar{const result=AvatarSchema.safeParse(value);return result.success?result.data:{...DEFAULT_AVATAR};}
/** v1 accepts free defaults only. M4 must validate earned ownership on the server;
 * editable Auth metadata is never an inventory or a source of grant evidence. */
export function equipAvatar(value:Avatar,slot:typeof AVATAR_SLOTS[number],id:string|null):Avatar {
 if(slot==="outfit"){if(!FREE_OUTFITS.some(item=>item.id===id))throw new Error("That outfit is not available.");return AvatarSchema.parse({...value,outfit:id});}
 if(id!==null)throw new Error("Earned equipment is not available yet.");return AvatarSchema.parse({...value,[slot]:null});
}
