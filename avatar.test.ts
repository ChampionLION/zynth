import assert from "node:assert/strict";
import {AvatarSchema,DEFAULT_AVATAR,parseAvatar,equipAvatar} from "./src/lib/avatar";
assert.deepEqual(parseAvatar(null),DEFAULT_AVATAR);
assert.deepEqual(parseAvatar({version:22,outfit:"unknown-future-item"}),DEFAULT_AVATAR,"Unreadable assets/versions keep a readable default");
assert.throws(()=>equipAvatar(DEFAULT_AVATAR,"outfit","earned-cloak"));
assert.throws(()=>equipAvatar(DEFAULT_AVATAR,"accessory","field-jacket"),/not available/);
assert.throws(()=>AvatarSchema.parse({...DEFAULT_AVATAR,aura:"level-100-aura"}));
assert.throws(()=>AvatarSchema.parse({...DEFAULT_AVATAR,exp:9000}),"Appearance never accepts progression fields");
const selected=equipAvatar(DEFAULT_AVATAR,"outfit","studio-knit");assert.equal(selected.outfit,"studio-knit");assert.equal(DEFAULT_AVATAR.outfit,"wayfarer-coat","Preview cannot mutate saved defaults");
assert.equal(equipAvatar(selected,"aura",null).aura,null);
const {gender:ignoredGender,...legacy}=DEFAULT_AVATAR;
assert.deepEqual(parseAvatar({...legacy,skin:"ebony",outfit:"field-jacket"}),{...DEFAULT_AVATAR,skin:"ebony",outfit:"field-jacket"},"Older saved avatars keep their selections");
for(const gender of ["male","female"] as const)for(const hair of ["crop","waves","coils","shaved","bob","long"] as const){
 const avatar=AvatarSchema.parse({...DEFAULT_AVATAR,gender,hair});
 assert.equal(parseAvatar(JSON.parse(JSON.stringify(avatar))).gender,gender);
 assert.equal(equipAvatar(avatar,"outfit","studio-knit").hair,hair,"All hairstyles and free outfits work for either gender");
}
console.log("Avatar boundary check passed: free equipment only, compatible slots, invalid-version fallback, immutable preview and no progression fields.");
