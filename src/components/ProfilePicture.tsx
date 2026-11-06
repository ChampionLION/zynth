"use client";
import type {PublicAppearance} from "@/lib/leaderboard-result";
import {parseAvatar} from "@/lib/avatar";
import {AvatarArt} from "./AvatarArt";
import {AvatarPortrait} from "./AvatarPortrait";
/** Own pictures follow cached edits immediately; other participants use only the public ranking projection. */
export function ProfilePicture({owner,appearance,name}:{owner?:string;appearance?:PublicAppearance;name:string}){
 if(owner)return <AvatarPortrait key={owner} owner={owner} picture name={name}/>;
 return <div className="profile-picture"><AvatarArt value={parseAvatar(appearance?.avatar)} equipment={appearance?.equipment} name={name} portrait/></div>;
}
