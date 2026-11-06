import {z} from "zod";
export const CosmeticSlot=z.enum(["outfit","accessory","aura"]);
export type CosmeticSlot=z.infer<typeof CosmeticSlot>;
export const EquipmentSchema=z.object({outfit:z.string().optional(),accessory:z.string().optional(),aura:z.string().optional()}).strict();
export type Equipment=z.infer<typeof EquipmentSchema>;
export const InventorySchema=z.object({version:z.literal(1),owner:z.string().uuid(),equipment:EquipmentSchema,items:z.array(z.object({
 id:z.string(),version:z.literal(1),slot:CosmeticSlot,name:z.string(),description:z.string(),rarity:z.string(),requirement:z.string(),rule:z.string(),owned:z.boolean(),equipped:z.boolean(),awardedAt:z.string().nullable(),
}))});
export type Inventory=z.infer<typeof InventorySchema>;
export type CosmeticItem=Inventory["items"][number];
export const EquipInput=z.object({slot:CosmeticSlot,itemId:z.string().min(1).max(80).nullable()}).strict();
export type EquipInput=z.infer<typeof EquipInput>;
export function previewEquipment(inventory:Inventory,slot:CosmeticSlot,itemId:string|null):Inventory{
 const equipment={...inventory.equipment};if(itemId===null)delete equipment[slot];else equipment[slot]=itemId;
 return {...inventory,equipment,items:inventory.items.map(item=>({...item,equipped:equipment[item.slot]===item.id}))};
}
