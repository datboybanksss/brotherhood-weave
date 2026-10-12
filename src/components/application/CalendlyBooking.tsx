import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
const url = "https://calendly.com/office-familyties/30min";
type CalendlyWindow = Window & { Calendly?: { initInlineWidget(options: { url: string; parentElement: HTMLElement }): void } };
export default function CalendlyBooking() {
 const container=useRef<HTMLDivElement>(null);const [booked,setBooked]=useState(false);const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let active=true;
  const init=()=>{if(active&&container.current){container.current.replaceChildren();(window as CalendlyWindow).Calendly?.initInlineWidget({url,parentElement:container.current});}};
  const onMessage=(e:MessageEvent)=>{const iframe=container.current?.querySelector('iframe');if(e.origin==='https://calendly.com'&&iframe&&e.source===iframe.contentWindow&&e.data?.event==='calendly.event_scheduled')setBooked(true);};
  window.addEventListener('message',onMessage);
  let script:HTMLScriptElement|undefined;
  if((window as CalendlyWindow).Calendly)init();else{script=document.createElement('script');script.src='https://assets.calendly.com/assets/external/widget.js';script.async=true;script.onload=init;script.onerror=()=>{if(active)setFailed(true);};document.head.appendChild(script);}
  return()=>{active=false;window.removeEventListener('message',onMessage);script?.remove();};
 },[]);
 return <section className="space-y-4">{booked?<div role="status" className="rounded-lg bg-brand-royal-tint p-5"><h3 className="font-serif text-2xl text-text-ink">Thank you for applying.</h3><p className="mt-3">After your applicant meeting, the founders will review your application and decide whether to grant you full access.</p><p className="mt-3">Look out for Calendly’s meeting confirmation at the email you used to book.</p><Link to="/login" className="mt-4 block text-brand-royal underline">Already created an account? Check your status</Link></div>:<><h3 className="font-semibold text-text-ink">Book your 30-minute applicant meeting</h3><p>Use the same email as your application. Booking a meeting does not grant member access.</p></>}<div ref={container} hidden={booked} className="min-h-[700px] w-full"/>{failed&&<p role="alert">The calendar couldn't load on this network. You can book using the link below.</p>}{!booked&&<><a href={url} target="_blank" rel="noreferrer" className="block text-brand-royal underline">Open Calendly in a new tab</a><p className="text-xs">If you book in another tab, Calendly provides your confirmation there. This page only updates automatically for bookings completed in the embedded calendar.</p></>}</section>;
}
