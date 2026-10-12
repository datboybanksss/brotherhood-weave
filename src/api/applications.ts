import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

export const applicationSchema = z.object({
  city: z.string().trim().min(2, "Please enter your city").max(100),
  occupation: z.string().trim().min(2, "Tell us what you do").max(150),
  motivation: z.string().trim().min(30, "Please write at least 30 characters").max(1500),
  contribution: z.string().trim().min(30, "Please write at least 30 characters").max(1500),
  commitment: z.boolean().refine(Boolean, "Please acknowledge the community commitment"),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type MembershipApplication = ApplicationInput & { user_id: string; submitted_at: string };
// Extend the generated schema locally until types are regenerated after migration.
type ApplicationDatabase = Database & { public: { Tables: {
  membership_applications: { Row: MembershipApplication; Insert: ApplicationInput & { user_id: string }; Update: never; Relationships: [] };
} } };
const db = supabase as unknown as SupabaseClient<ApplicationDatabase>;
export async function getApplication(userId: string) {
  const { data, error } = await db.from("membership_applications").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function submitApplication(userId: string, input: ApplicationInput) {
  const values = applicationSchema.parse(input);
  const { error } = await db.from("membership_applications").insert({ ...values, user_id: userId });
  if (error) throw error;
}
