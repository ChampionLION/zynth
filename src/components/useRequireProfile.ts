"use client";
import {useZynth} from "@/lib/store";
/** AccountProvider restores and guards the account before protected pages mount. */
export function useRequireProfile(){
 const {profile,hydrated}=useZynth();
 return {profile,hydrated};
}
