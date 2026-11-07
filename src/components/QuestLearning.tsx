"use client";
import type {Quest} from "@/lib/types";
import {selectedLearningOption} from "@/lib/learning";

export function QuestLearning({quest,response,onSelect,disabled,part="all"}:{quest:Quest;response:string;onSelect:(key:string)=>void;disabled:boolean;part?:"all"|"lessons"|"check"}){
 const content=quest.learning;if(!content)return null;
 const selected=selectedLearningOption(quest,response);
 return <section className="quest-learning" aria-label="Today's lessons">
  {part!=="check"&&<><div className="quest-learning-intro"><p className="eyebrow">LEARN, THEN TRY</p><h2>{content.objective}</h2><p>{content.lessons.length===2?"Two short lessons":"One short lesson"}. One small check. Take the examples with you as you answer.</p></div>
  {content.lessons.map((lesson,index)=><article className="quest-lesson" key={`${index}:${lesson.title}`}><span className="eyebrow">LESSON {String(index+1).padStart(2,"0")}</span><h3>{lesson.title}</h3><p>{lesson.explanation}</p><div className="quest-worked-example"><span>WORKED EXAMPLE</span><p>{lesson.example}</p></div></article>)}
  </>}{part!=="lessons"&&<fieldset className="quest-check" disabled={disabled}><legend>A small check</legend><p>{content.check.question}</p><p className="quest-check-note">Choose a solution using what you just learned. You can look back at the lessons.</p><div className="quest-check-options">{content.check.options.map(option=><label key={option.key} className={selected===option.key?"selected":""}><input type="radio" name="learning-check" value={option.key} checked={selected===option.key} onChange={()=>onSelect(option.key)}/><span><b>{option.key}</b>{option.label}</span></label>)}</div></fieldset>}
 </section>;
}
