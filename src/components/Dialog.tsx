"use client";
import {useEffect,useRef} from "react";
export function Dialog({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),closeRef=useRef(onClose);closeRef.current=onClose;
 useEffect(()=>{const dialog=ref.current,previous=document.activeElement;dialog?.showModal();return()=>{dialog?.close();if(previous instanceof HTMLElement)previous.focus();};},[]);
 return <dialog ref={ref} className="zynth-dialog" aria-label={title} onCancel={event=>{event.preventDefault();closeRef.current();}}><h2>{title}</h2>{children}</dialog>;
}
