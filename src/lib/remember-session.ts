// Only the Supabase session uses this adapter; passwords are never saved here.
const preference = "zynth:remember-me";
const memory = new Map<string,string>();
function storage(persistent:boolean):Storage|undefined {
  try { return persistent ? globalThis.localStorage : globalThis.sessionStorage; } catch { return undefined; }
}
export function remembersSession():boolean { return storage(true)?.getItem(preference)!=="no"; }
export function setRememberSession(remember:boolean,sessionKey:string):void {
  const keys=[sessionKey,`${sessionKey}-code-verifier`];
  const values=keys.map(key=>sessionStorageAdapter.getItem(key));
  storage(true)?.setItem(preference,remember?"yes":"no");
  for(const [index,key] of keys.entries()) {
    const current=values[index];
    storage(!remember)?.removeItem(key);
    if(current)storage(remember)?.setItem(key,current);
  }
}
export const sessionStorageAdapter = {
  getItem(key:string):string|null { return storage(remembersSession())?.getItem(key)??memory.get(key)??null; },
  setItem(key:string,value:string):void {
    const target=storage(remembersSession());
    if(target){target.setItem(key,value);memory.delete(key);}else memory.set(key,value);
    storage(!remembersSession())?.removeItem(key);
  },
  removeItem(key:string):void {storage(true)?.removeItem(key);storage(false)?.removeItem(key);memory.delete(key);},
};
