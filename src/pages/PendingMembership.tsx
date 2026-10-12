import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import PublicNavigation from "@/components/PublicNavigation";
export default function PendingMembership() {
 const {user,loading}=useAuth();const q=useCurrentUser();const [error,setError]=useState(false);
 const choice=sessionStorage.getItem('membership-choice') ?? user?.user_metadata?.membership_request_kind;
 const userId=user?.id, hasAccount=!!q.data, requestKind=q.data?.membership_request_kind;
 const {refetch}=q;
 useEffect(()=>{
  if(!userId||!hasAccount||requestKind||(choice!=='existing'&&choice!=='new'))return;
  let active=true;
  supabase.from('users').update({membership_request_kind:choice} as never).eq('id',userId).then(({error})=>{
   if(!active)return;
   if(error)setError(true);else{sessionStorage.removeItem('membership-choice');refetch();}
  });
  return()=>{active=false;};
 },[userId,hasAccount,requestKind,choice,refetch]);
 if(loading||(user&&q.isLoading))return <p className="p-6">Loading…</p>;
 if(!user)return <Navigate to="/login" replace/>;
 if(q.data?.payment_status==='paid'&&!q.data.rejected_at)return <Navigate to="/app" replace/>;
 if(!q.data?.membership_request_kind&&!choice&&!q.isError&&!q.data?.rejected_at)return <Navigate to="/entry" replace/>;
 return <div className="min-h-screen bg-surface-cream"><PublicNavigation/><main className="mx-auto mt-12 max-w-md space-y-5 rounded-xl border bg-card p-6"><h1 className="font-serif text-3xl">{q.data?.rejected_at?'Application update':'Pending founder approval'}</h1>{error||q.isError?<p role="alert">We couldn't load or save your request. Please refresh or contact the team.</p>:q.data?.rejected_at?<p>Your application was not approved at this time. You can contact the team with questions.</p>:q.data?.membership_request_kind==='existing'?<p>Your account is pending founder approval. Approval takes up to 6 hours. You can contact the team directly to help speed up the process.</p>:<><p>Complete your application and book your meeting. After your applicant meeting, the founders will decide whether to grant you full access.</p><Button asChild><Link to="/apply">Continue application</Link></Button></>}<Link to="/support" className="block text-brand-royal underline">Contact the team</Link><Button variant="outline" onClick={()=>q.refetch()}>Refresh status</Button><Button variant="ghost" onClick={()=>supabase.auth.signOut()}>Sign out</Button></main></div>;
}
