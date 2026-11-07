import assert from 'node:assert/strict';
import {GAME_COUNT,GAME_KINDS,makeGame,lanternMove,offerGame,saveGameReceipt} from './src/lib/reward-games';
const counts=new Map<string,number>();
for(let id=0;id<GAME_COUNT;id++){
 const g=makeGame(id);counts.set(g.kind,(counts.get(g.kind)??0)+1);assert.deepEqual(makeGame(id),g,'Reloads preserve the same puzzle');
 switch(g.kind){
  case 'pairs':for(let n=0;n<4;n++)assert.equal(g.board.filter(v=>v===n).length,2);break;
  case 'slide':{const a=g.board.filter(Boolean),inversions=a.reduce((sum,v,i)=>sum+a.slice(i+1).filter(n=>n<v).length,0);assert.equal(inversions%2,0,'Every sliding board is solvable');assert.deepEqual([...g.board].sort(),[0,1,2,3,4,5,6,7,8]);break;}
  case 'lanterns':{let b=g.board;for(const move of [...g.solution].reverse())b=lanternMove(b,move);assert.ok(b.every(Boolean));break;}
  case 'sequence':assert.ok(g.board.length>=4&&g.board.every(v=>v>=0&&v<4));break;
  case 'trail':assert.equal(g.solution[0],0);assert.equal(g.solution.at(-1),15);g.solution.forEach((n,i)=>{assert.equal(g.board[n],1);if(i)assert.equal(Math.abs(n%4-g.solution[i-1]%4)+Math.abs(Math.floor(n/4)-Math.floor(g.solution[i-1]/4)),1);});break;
  case 'sum':assert.ok(g.board.some((v,i)=>g.board.some((n,j)=>i!==j&&v+n===g.solution[0])));break;
  case 'order':assert.equal(new Set(g.board).size,g.board.length);break;
  case 'word':assert.deepEqual([...g.board].sort((a,b)=>a-b),[...g.word].map((_,i)=>i));break;
  case 'pattern':assert.equal(g.solution[0]-g.board[3],g.board[1]-g.board[0]);break;
  case 'odd':assert.equal(g.board.filter(n=>n===g.board[g.solution[0]]).length,1);break;
 }
}
assert.equal(counts.size,GAME_KINDS.length);for(const n of counts.values())assert.equal(n,30);
const data=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}});
const first=offerGame('owner','quest');assert.deepEqual(offerGame('owner','quest'),first);
saveGameReceipt('owner','quest',{...first,status:'done'});assert.equal(offerGame('owner','quest').status,'done','Finished games cannot reroll');
saveGameReceipt('owner','quest',{...first,status:'skipped'});assert.equal(offerGame('owner','quest').status,'skipped','Skipped games cannot reroll');
offerGame('other','quest');assert.equal(data.size,2,'Receipts are isolated by account');
assert.throws(()=>makeGame(-1));assert.throws(()=>makeGame(300));
console.log('300 reward puzzles passed: deterministic boards, solvability, one draw per clear, skip/completion persistence and account isolation.');
