"use client";
import {useEffect,useMemo,useState} from 'react';
import {Button} from './ui/Atlas';
import {makeGame,offerGame,saveGameReceipt,lanternMove,slideMove,shuffle,randomSource,type GameReceipt} from '@/lib/reward-games';
import '@/styles/reward-games.css';
export function RewardGame({owner,questId}:{owner:string;questId:string}){
 const [receipt,setReceipt]=useState<GameReceipt|null>(null);
 useEffect(()=>{setReceipt(offerGame(owner,questId));},[owner,questId]);
 const update=(status:GameReceipt['status'])=>{if(!receipt)return;const next={...receipt,status};saveGameReceipt(owner,questId,next);setReceipt(next);};
 if(!receipt||receipt.status==='skipped')return null;
 return <section className="reward-game" aria-label="Your quest reward"><p className="eyebrow">A LITTLE PLAY, EARNED</p>{receipt.status==='done'?<><h2>A lovely little detour.</h2><p>Ready for your next chapter?</p></>:receipt.status==='offered'?<><h2>{makeGame(receipt.id).title}</h2><p>One small game, just for the fun of it.</p><div className="game-actions"><Button onClick={()=>update('playing')}>Play my reward</Button><Button variant="ghost" onClick={()=>update('skipped')}>Skip game</Button></div></>:<><MiniGame key={receipt.id} id={receipt.id} onDone={()=>update('done')}/><Button variant="ghost" onClick={()=>update('skipped')}>Skip game</Button></>}</section>;
}
function MiniGame({id,onDone}:{id:number;onDone:()=>void}){
 const game=useMemo(()=>makeGame(id),[id]),[board,setBoard]=useState(game.board),[chosen,setChosen]=useState<number[]>([]),[matched,setMatched]=useState<number[]>([]),[revealed,setRevealed]=useState(true),[position,setPosition]=useState(0),[message,setMessage]=useState(''),[won,setWon]=useState(false);
 const finish=()=>{setWon(true);setMessage('Beautifully done.');};
 useEffect(()=>{if(game.kind!=='pairs'||chosen.length!==2)return;const [a,b]=chosen;if(board[a]===board[b]){setMatched(m=>[...m,a,b]);setChosen([]);}else{const timer=setTimeout(()=>setChosen([]),900);return()=>clearTimeout(timer);}},[chosen,board,game.kind]);
 useEffect(()=>{if(game.kind==='pairs'&&matched.length===8)setWon(true);},[matched,game.kind]);
 const pick=(i:number)=>{
  if(won)return;setMessage('');
  switch(game.kind){
   case 'pairs':if(chosen.length<2&&!chosen.includes(i)&&!matched.includes(i))setChosen([...chosen,i]);break;
   case 'slide':{const next=slideMove(board,i);setBoard(next);if(next.every((n,j)=>n===(j+1)%9))finish();break;}
   case 'lanterns':{const next=lanternMove(board,i);setBoard(next);if(next.every(Boolean))finish();break;}
   case 'sequence':if(revealed)return;else if(i===board[chosen.length]){const next=[...chosen,i];setChosen(next);if(next.length===board.length)finish();}else{setChosen([]);setRevealed(true);setMessage('Take another look, then try the same trail.');}break;
   case 'trail':if(board[i]&&Math.abs(i%4-position%4)+Math.abs(Math.floor(i/4)-Math.floor(position/4))===1){setPosition(i);if(i===15)finish();}break;
   case 'sum':{if(chosen.includes(i)){setChosen(chosen.filter(n=>n!==i));break;}const next=[...chosen,i];if(next.length===2){if(next.reduce((n,j)=>n+board[j],0)===game.solution[0])finish();else{setChosen([]);setMessage('Try a different pair.');}}else setChosen(next);break;}
   case 'order':{const expected=[...board].sort((a,b)=>a-b)[chosen.length];if(board[i]===expected&&!chosen.includes(i)){setChosen([...chosen,i]);if(chosen.length===5)finish();}else setMessage('Look for the smallest stone still waiting.');break;}
   case 'word':if(!chosen.includes(i)){const next=[...chosen,i];setChosen(next);if(next.length===board.length){if(next.map(j=>game.word[board[j]]).join('')===game.word)finish();else setMessage('Not quite. Clear the letters and try again.');}}break;
   case 'pattern':if(i===game.solution[0])finish();else setMessage('Look at the gap between neighbouring numbers.');break;
   case 'odd':if(i===game.solution[0])finish();else setMessage('Look for the different symbol.');break;
  }
 };
 const instructions={pairs:'Find the four matching pairs.',slide:'Slide neighbouring stones into order, 1 to 8.',lanterns:'Light every lantern. Each tap toggles its neighbours too.',sequence:'Remember the trail, then repeat it in order.',trail:'Follow the open passage to the flag. Move one square at a time.',sum:`Choose two stones that total ${game.solution[0]}.`,order:'Pick the stones from smallest to largest.',word:'Arrange the letters into a word from the explorer’s journal.',pattern:'Which number comes next?',odd:'Find the symbol that is different.'};
 const symbols=['✦','♧','◇','○','✧','♤','◆','◎'];
 const cells=game.kind==='pattern'?shuffle([game.solution[0],game.solution[0]+2,game.solution[0]-1],randomSource(id)):game.kind==='sequence'?[0,1,2,3]:board.map((_,i)=>i);
 return <div className="mini-game"><h2>{game.title}</h2><p>{instructions[game.kind]}</p>{won?<div className="game-win" role="status"><span aria-hidden="true">✦</span><h3>Beautifully done.</h3><Button onClick={onDone}>Keep becoming →</Button></div>:<>
 {game.kind==='sequence'&&<><p className="game-sequence" aria-label={revealed?'Trail to remember':'Your progress'}>{(revealed?board:chosen).map((n,i)=><span key={i}>{symbols[n]}</span>)}{!revealed&&chosen.length===0&&'Your turn'}</p>{revealed&&<Button onClick={()=>{setRevealed(false);setChosen([]);}}>I’m ready</Button>}</>}
 {game.kind==='pattern'&&<p className="game-sequence">{board.join(' · ')} · ?</p>}
 {game.kind==='word'&&<><p className="game-sequence" aria-live="polite">{chosen.map(i=>game.word[board[i]]).join(' ')||'…'}</p><Button variant="ghost" onClick={()=>{setChosen([]);setMessage('');}}>Clear letters</Button></>}
 <div className={`game-board game-${game.kind}`}>{cells.map((i)=>{const disabled=game.kind==='pairs'?matched.includes(i):game.kind==='word'||game.kind==='order'?chosen.includes(i):game.kind==='sequence'?revealed:game.kind==='slide'?board[i]===0:game.kind==='trail'?!board[i]:false;
 const label=game.kind==='pairs'?(chosen.includes(i)||matched.includes(i)?symbols[board[i]]:'?'):game.kind==='lanterns'?(board[i]?'✦':'○'):game.kind==='sequence'?symbols[i]:game.kind==='trail'?(i===position?'●':i===15?'⚑':board[i]?'·':''):game.kind==='word'?game.word[board[i]]:game.kind==='odd'?symbols[board[i]]:game.kind==='pattern'?i:board[i]||'';
 return <button key={i} type="button" disabled={disabled} aria-label={game.kind==='pairs'?`Card ${i+1}${chosen.includes(i)||matched.includes(i)?`: ${label}`:''}`:game.kind==='lanterns'?`Lantern ${i+1}, ${board[i]?'lit':'unlit'}`:game.kind==='trail'?`Square ${i+1}${i===position?', you are here':i===15?', finish':''}`:String(label)} aria-pressed={game.kind==='sum'?chosen.includes(i):undefined} className={`${chosen.includes(i)?'is-chosen':''} ${game.kind==='lanterns'&&board[i]?'is-lit':''} ${matched.includes(i)?'is-matched':''}`} onClick={()=>pick(i)}>{label}</button>;})}</div>
 <p role="status" className="game-hint">{message}</p></>}
 </div>;
}
