import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PublicNavigation from "@/components/PublicNavigation";
import { toast } from "sonner";
export default function MembershipEntry() {
 const {user,loading}=useAuth();const q=useCurrentUser();const nav=useNavigate();const qc=useQueryClient();const [busy,setBusy]=useState(false);
 if(loading || (user&&q.isLoading))return <p className="p-6">Loading…</p>;
 if(q.isError)return <div className="p-6"><p>We couldn't load your account.</p><Button onClick={()=>q.refetch()}>Try again</Button></div>;
 if(q.data?.payment_status==='paid'&&!q.data.rejected_at)return <Navigate to="/app" replace/>;
 if(q.data?.membership_request_kind || q.data?.rejected_at)return <Navigate to="/pending" replace/>;
 async function choose(kind:'existing'|'new') {setBusy(true);sessionStorage.setItem('membership-choice',kind);if(user){const {error}=await supabase.from('users').update({membership_request_kind:kind} as never).eq('id',user.id);if(error){toast.error('Could not save your choice. Please try again.');setBusy(false);return;}await qc.invalidateQueries({queryKey:['currentUser']});}nav(kind==='new'?'/apply':user?'/pending':'/signup?kind=existing');}
 return <div className="min-h-screen bg-surface-cream"><PublicNavigation/><Dialog open onOpenChange={open=>{if(!open)nav('/login');}}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="font-serif text-3xl">Welcome to Family Ties.</DialogTitle><DialogDescription>Are you an existing member or applying for the first time?</DialogDescription></DialogHeader><Button disabled={busy} className="bg-brand-royal hover:bg-brand-royal-deep" onClick={()=>choose('existing')}>I'm an existing member</Button><Button disabled={busy} variant="outline" onClick={()=>choose('new')}>I'm applying for the first time</Button><p className="text-center text-sm text-muted-foreground">Already have an approved account? <Link to="/login" className="text-brand-royal underline">Log in</Link></p></DialogContent></Dialog></div>;
}
