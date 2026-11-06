import {NextRequest} from "next/server";
import {EquipInput} from "@/lib/inventory";
import {JourneyError} from "@/lib/server/complete-quest";
import {journeyAuth,journeyBody,journeyReply,journeyFailure,trustedClient} from "@/lib/server/journey-http";
export async function GET(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url);
 const {data,error}=await client.rpc("sync_cosmetic_inventory",{p_user_id:user.id});if(error)throw error;
 return journeyReply(data);
}catch(error){return journeyFailure(error);}}
export async function POST(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url);
 const parsed=EquipInput.safeParse(await journeyBody(req,1000));if(!parsed.success)throw new JourneyError("Choose an item and its matching slot.",400);
 const {data,error}=await client.rpc("equip_cosmetic",{p_user_id:user.id,p_slot:parsed.data.slot,p_item_id:parsed.data.itemId});
 if(error){if(error.code==="22023")throw new JourneyError("This item is not available for that slot. Refresh your inventory and try again.",400);throw error;}
 return journeyReply(data);
}catch(error){return journeyFailure(error);}}
