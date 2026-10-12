import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import RouteGuard from "./RouteGuard";
const state=vi.hoisted(()=>({user:null as null|{id:string},account:null as null|Record<string,unknown>}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>({user:state.user,loading:false})}));
vi.mock('@/hooks/useCurrentUser',()=>({useCurrentUser:()=>({data:state.account,isLoading:false,isError:false})}));
function mount(){render(<MemoryRouter initialEntries={['/app']}><Routes><Route path="/entry" element={<p>Membership choice</p>}/><Route path="/pending" element={<p>Founder approval pending</p>}/><Route element={<RouteGuard/>}><Route path="/app" element={<p>Private member dashboard</p>}/></Route></Routes></MemoryRouter>);}
describe('member access',()=>{
 it('routes signed-out Go to app visitors to the choice',()=>{state.user=null;state.account=null;mount();expect(screen.getByText('Membership choice')).toBeInTheDocument();});
 it('blocks an existing-member claim until approved',()=>{state.user={id:'test'};state.account={payment_status:'pending',membership_request_kind:'existing'};mount();expect(screen.getByText('Founder approval pending')).toBeInTheDocument();expect(screen.queryByText('Private member dashboard')).not.toBeInTheDocument();});
 it('admits approved members without a popup',()=>{state.user={id:'test'};state.account={payment_status:'paid'};mount();expect(screen.getByText('Private member dashboard')).toBeInTheDocument();});
 it('blocks a rejected account even with the old access flag',()=>{state.user={id:'test'};state.account={payment_status:'paid',rejected_at:'2026-10-12'};mount();expect(screen.getByText('Founder approval pending')).toBeInTheDocument();});
});
