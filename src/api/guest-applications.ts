import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabase";
import { applicationSchema } from "./applications";
export const guestSchema = applicationSchema.extend({ full_name: z.string().trim().min(2, "Name required").max(100), email: z.string().trim().email("Enter a valid email").max(255) });
export type GuestInput = z.infer<typeof guestSchema>;
export type GuestApplication = GuestInput & { id: string; status: "pending" | "approved" | "declined"; submitted_at: string; invitation_id: string | null };
type GuestDatabase = Database & { public: { Tables: { guest_applications: { Row: GuestApplication; Insert: never; Update: never; Relationships: [] } }; Functions: {
 submit_guest_application: { Args: { p_full_name: string; p_email: string; p_city: string; p_occupation: string; p_motivation: string; p_contribution: string; p_commitment: boolean }; Returns: undefined };
 review_guest_application: { Args: { p_id: string; p_approve: boolean; p_interview_held: boolean }; Returns: string | null };
} } };
const db = supabase as unknown as SupabaseClient<GuestDatabase>;
export async function submitGuestApplication(input: GuestInput) {
 const d = guestSchema.parse(input);
 const { error } = await db.rpc("submit_guest_application", { p_full_name:d.full_name,p_email:d.email,p_city:d.city,p_occupation:d.occupation,p_motivation:d.motivation,p_contribution:d.contribution,p_commitment:d.commitment });
 if (error) throw error;
}
export async function listGuestApplications() { const {data,error} = await db.from("guest_applications").select("*").order("submitted_at",{ascending:false}); if(error) throw error; return data; }
export async function reviewGuestApplication(id:string,approve:boolean,interviewHeld:boolean) { const {data,error}=await db.rpc("review_guest_application",{p_id:id,p_approve:approve,p_interview_held:interviewHeld}); if(error) throw error; return data; }
