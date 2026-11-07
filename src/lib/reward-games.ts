export const GAME_KINDS=['pairs','slide','lanterns','sequence','trail','sum','order','word','pattern','odd'] as const;
export type GameKind=typeof GAME_KINDS[number];
export const GAME_COUNT=300;
export const GAME_NAMES:Record<GameKind,string>={pairs:'Field notes',slide:'Sliding stones',lanterns:'Lantern grove',sequence:'Echo trail',trail:'Secret passage',sum:'Pocket balance',order:'River stones',word:'Lost word',pattern:'Next constellation',odd:'One of a kind'};
const words=['JOURNEY','LANTERN','FOREST','COPPER','GARDEN','COMPASS','RIVER','SUMMIT','WONDER','MEADOW','POCKET','SPARK','BRIDGE','ORCHARD','HORIZON','PAPER','GROVE','TRAIL','SPRING','BEACON','QUIET','GROWTH','ATLAS','EXPLORE','BLOOM','PATHWAY','MOMENT','LEAVES','STONES','ZENITH'];
export function randomSource(seed:number){let state=seed+1;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function lanternMove(board:number[],index:number){const next=[...board];for(const i of [index,index%3>0?index-1:-1,index%3<2?index+1:-1,index-3,index+3])if(i>=0&&i<9)next[i]=1-next[i];return next;}
export function slideMove(board:number[],index:number){const blank=board.indexOf(0);if(Math.abs(index%3-blank%3)+Math.abs(Math.floor(index/3)-Math.floor(blank/3))!==1)return board;const next=[...board];[next[index],next[blank]]=[next[blank],next[index]];return next;}
export function makeGame(id:number){
 if(!Number.isInteger(id)||id<0||id>=GAME_COUNT)throw new Error('Unknown reward game');
 const kind=GAME_KINDS[Math.floor(id/30)],variant=id%30,r=randomSource(id+93);
 let board:number[]=[],solution:number[]=[];
 if(kind==='pairs')board=shuffle([0,0,1,1,2,2,3,3],r);
 if(kind==='slide'){board=[1,2,3,4,5,6,7,8,0];for(let i=0;i<18+variant;i++){const blank=board.indexOf(0),moves=[blank-3,blank+3,blank%3>0?blank-1:-1,blank%3<2?blank+1:-1].filter(n=>n>=0&&n<9);board=slideMove(board,moves[Math.floor(r()*moves.length)]);}if(board.every((n,i)=>n===(i+1)%9))board=slideMove(board,7);}
 if(kind==='lanterns'){board=Array(9).fill(1);solution=shuffle([0,1,2,3,4,5,6,7,8],r).slice(0,3+variant%4);for(const n of solution)board=lanternMove(board,n);if(board.every(Boolean)){board=lanternMove(board,0);solution.push(0);}}
 if(kind==='sequence')board=Array.from({length:4+variant%3},()=>Math.floor(r()*4));
 if(kind==='trail'){let pos=0;solution=[0];while(pos!==15){const options=[pos%4<3?pos+1:-1,pos<12?pos+4:-1].filter(n=>n>=0);pos=options[Math.floor(r()*options.length)];solution.push(pos);}board=Array.from({length:16},(_,i)=>solution.includes(i)?1:0);}
 if(kind==='sum'){const a=2+variant,b=3+Math.floor(r()*15);board=shuffle([a,b,a+b+1,a+b+3,a+b+6,a+b+9],r);solution=[a+b];}
 if(kind==='order')board=shuffle(Array.from({length:6},(_,i)=>variant+i*3+1),r);
 if(kind==='word')board=shuffle([...words[variant]].map((_,i)=>i),r);
 if(kind==='pattern'){const start=variant+2,step=2+variant%7;board=Array.from({length:4},(_,i)=>start+i*step);solution=[start+4*step];}
 if(kind==='odd'){board=Array(16).fill(variant%4);solution=[Math.floor(r()*16)];board[solution[0]]=4+variant%4;}
 return {id,kind,variant,title:GAME_NAMES[kind],board,solution,word:words[variant]};
}
export interface GameReceipt {id:number;status:'offered'|'playing'|'done'|'skipped'}
const receiptKey=(owner:string,quest:string)=>`zynth:reward-game:v1:${owner}:${quest}`;
export function readGameReceipt(owner:string,quest:string):GameReceipt|null{try{const v=JSON.parse(localStorage.getItem(receiptKey(owner,quest))??'null');return v&&Number.isInteger(v.id)&&v.id>=0&&v.id<GAME_COUNT&&['offered','playing','done','skipped'].includes(v.status)?v:null;}catch{return null;}}
export function saveGameReceipt(owner:string,quest:string,receipt:GameReceipt){try{localStorage.setItem(receiptKey(owner,quest),JSON.stringify(receipt));}catch{/* Optional play remains usable without persistent storage. */}}
export function offerGame(owner:string,quest:string):GameReceipt{
 const existing=readGameReceipt(owner,quest);if(existing)return existing;
 const random=crypto.getRandomValues(new Uint32Array(1))[0],receipt:GameReceipt={id:random%GAME_COUNT,status:'offered'};
 saveGameReceipt(owner,quest,receipt);return receipt;
}
