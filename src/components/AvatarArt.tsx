import {parseAvatar,SKIN_COLORS,HAIR_COLORS,OUTFIT_COLORS,type Avatar} from "@/lib/avatar";
/** Inline SVG layers have no remote asset dependency. Invalid versions/IDs fall
 * back to the free default; no visual layer makes an ownership/XP claim. */
export function AvatarArt({value,name="Your Wayfarer"}:{value:Avatar;name?:string}){
 const avatar=parseAvatar(value),skin=SKIN_COLORS[avatar.skin],hair=HAIR_COLORS[avatar.hairColor],cloth=OUTFIT_COLORS[avatar.palette];
 return <div className={`avatar-art scene-${avatar.background}`} role="img" aria-label={`${name}, wearing a ${avatar.outfit.replaceAll("-"," ")}`}>
 <svg viewBox="0 0 480 480" aria-hidden="true" focusable="false">
  <circle cx="240" cy="178" r="138" className="avatar-halo"/>
  {avatar.background==="atrium"?<g className="avatar-architecture"><path d="M107 382V195a133 133 0 0 1 266 0v187M130 382V195a110 110 0 0 1 220 0v187"/><path d="M86 382h308M67 400h346M47 420h386"/></g>:avatar.background==="grove"?<g className="avatar-architecture"><path d="M66 381Q130 230 96 101M395 381Q338 220 380 92M95 221q-68-35-53-81 59 4 53 81M98 170q67-29 66-74-60-5-66 74M376 182q-67-40-60-78 60 0 60 78M379 244q62-28 62-68-54-9-62 68"/><path d="M59 401q180-51 364 0"/></g>:<g className="avatar-architecture"><path d="M66 130h348M66 143h348M96 143v245M385 143v245M67 319h110M324 319h90M87 339v62M394 339v62"/><rect x="117" y="82" width="46" height="48" rx="5"/><rect x="177" y="96" width="22" height="34" rx="3"/><circle cx="352" cy="100" r="29"/></g>}
  <ellipse cx="240" cy="408" rx="98" ry="13" fill="currentColor" opacity=".08"/>
  <path d="m197 323-6 78q10 8 29 0l18-65 10 65q18 8 29 0l-3-78" fill="#343b38"/>
  <path d="M188 396h33v15h-43q-4-9 10-15M249 396h31q18 5 17 15h-48" fill="#252c2a"/>
  <path d="M184 219q-30 7-37 100l15 4 32-76M292 219q29 8 36 100l-15 4-31-76" fill={cloth}/>
  <path d="m147 316 15 3 1 18q-7 13-15 0zM313 319l15-3-1 21q-8 13-15 0z" fill={skin}/>
  <path d={avatar.outfit==="studio-knit"?"M193 211q45-19 91 0l13 112q-58 15-113 0z":avatar.outfit==="field-jacket"?"M192 213q48-23 94 0l12 125H182z":"M192 212q48-24 94 0l18 148-64-8-64 8z"} fill={cloth}/>
  <path d="M217 202v20q24 23 46 0v-20" fill={skin}/>
  {avatar.outfit==="studio-knit"?<g fill="none" stroke="#fff" opacity=".2"><path d="M203 245h74M199 259h82M196 273h88M194 287h92"/></g>:<g fill="none" stroke="#fff" opacity=".3"><path d="m215 214 25 33 24-33M240 247v98"/><path d="M198 277h27v24h-27M256 277h27v24h-27"/></g>}
  <path d="M204 144q-15-2-12 17 1 13 13 13M275 144q15-2 12 17-1 13-13 13" fill={skin}/>
  <path d="M200 130q0-50 40-50t40 50v38q-3 43-40 45-37-2-40-45z" fill={skin}/>
  <path d="M206 163q9-7 17-2M257 161q9-5 16 2" fill="none" stroke={hair} strokeWidth="3" strokeLinecap="round"/>
  <path d="M222 186q18 9 36 0" fill="none" stroke="#593e34" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
  {avatar.hair==="waves"?<path d="M196 153v-29q-3-54 46-54 50 1 44 57l-5 25-10-37q-40 20-62 5l-5 33z" fill={hair}/>:avatar.hair==="coils"?<g fill={hair}><path d="M195 147v-34h91v34l-12-24h-65l-7 25z"/>{[[206,99],[226,83],[250,82],[272,94],[284,116],[196,120],[241,103]].map(([x,y])=><circle key={`${x}:${y}`} cx={x} cy={y} r="20"/>)}</g>:avatar.hair==="crop"?<path d="M197 145v-29q-2-42 44-42 44 0 44 41v30l-9-27-68-5z" fill={hair}/>:<path d="M201 125q2-44 40-44t38 44q-40-13-78 0" fill={hair} opacity=".22"/>}
  <circle cx="240" cy="264" r="5" fill="#d6b474"/>
 </svg><span className="avatar-art-caption" aria-hidden="true">Z / WAYFARER</span>
 </div>;
}
