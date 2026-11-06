import {createClient} from "@supabase/supabase-js";
import {NextRequest} from "next/server";
import {publicSupabaseConfig} from "@/lib/supabase";
import {journeyBody,journeyReply,journeyBudget} from "@/lib/server/journey-http";

/** A public demo identity only. Never accepts an email, user ID or role. */
export async function POST(req:NextRequest){
 try{
  const input=await journeyBody(req,500) as {username?:unknown;password?:unknown};
  if(input?.username!=="guest"||input?.password!=="guest")return journeyReply({error:"That username and password don’t match."},401);
  const {url,key}=publicSupabaseConfig(),secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret||!url||!key)return journeyReply({error:"Guest access is unavailable."},503);
  const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
  const admin=createClient(url,secret,options),email="guest-demo@zynth.invalid";
  const created=await admin.auth.admin.createUser({email,email_confirm:true,password:crypto.randomUUID()+crypto.randomUUID(),app_metadata:{zynth_guest:true},user_metadata:{full_name:"Guest"}});
  if(created.error&&!['email_exists','user_already_exists'].includes(created.error.code??''))return journeyReply({error:"Guest access is unavailable."},503);
  const link=await admin.auth.admin.generateLink({type:"magiclink",email});
  if(link.error||!link.data.user?.app_metadata?.zynth_guest||!link.data.properties?.hashed_token)return journeyReply({error:"Guest access is unavailable."},503);
  await journeyBudget(admin,link.data.user.id,"guest_login",10);
  const client=createClient(url,key,options);
  const {data,error}=await client.auth.verifyOtp({type:"email",token_hash:link.data.properties.hashed_token});
  if(error||!data.session)return journeyReply({error:"Could not open the guest account. Please try again."},503);
  return journeyReply({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
 }catch{return journeyReply({error:"Guest access is busy. Please try again shortly."},429);}
}
