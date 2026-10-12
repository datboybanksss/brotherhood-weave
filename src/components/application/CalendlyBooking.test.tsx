import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect, vi } from 'vitest';
import CalendlyBooking from './CalendlyBooking';
it('shows thanks only for scheduled events from the active Calendly iframe',()=>{
 let frame:HTMLIFrameElement;
 Object.assign(window,{Calendly:{initInlineWidget:vi.fn(({parentElement})=>{frame=document.createElement('iframe');parentElement.appendChild(frame);})}});
 render(<MemoryRouter><CalendlyBooking/></MemoryRouter>);
 const send=(origin:string,event:string,source:Window|null)=>act(()=>window.dispatchEvent(new MessageEvent('message',{origin,source,data:{event}})));
 send('https://evil.example','calendly.event_scheduled',frame!.contentWindow);
 send('https://calendly.com','calendly.date_and_time_selected',frame!.contentWindow);
 send('https://calendly.com','calendly.event_scheduled',window);
 expect(screen.queryByText('Thank you for applying.')).not.toBeInTheDocument();
 send('https://calendly.com','calendly.event_scheduled',frame!.contentWindow);
 expect(screen.getByText('Thank you for applying.')).toBeInTheDocument();
});
