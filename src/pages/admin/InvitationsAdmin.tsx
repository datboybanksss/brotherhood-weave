import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface Invitation {
  id: string;
  email: string;
  full_name: string;
  token: string;
  intended_tier: string;
  is_admin: boolean;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  is_admin: z.boolean(),
  expires_in_days: z.coerce.number().int().min(1).max(365),
});
type FormData = z.infer<typeof schema>;

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

function classify(inv: Invitation): "active" | "used" | "expired" | "revoked" {
  if (inv.revoked_at) return "revoked";
  if (inv.used_at) return "used";
  if (new Date(inv.expires_at).getTime() <= Date.now()) return "expired";
  return "active";
}

export default function InvitationsAdmin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: appUser } = useCurrentUser();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["adminInvitations"],
    queryFn: async (): Promise<Invitation[]> => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!appUser?.is_admin,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_admin: false, expires_in_days: 30 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const token = generateToken();
      const expires_at = new Date(Date.now() + data.expires_in_days * 86400_000).toISOString();
      const { data: row, error } = await supabase
        .from("invitations")
        .insert({
          token,
          email: data.email,
          full_name: data.full_name,
          is_admin: data.is_admin,
          intended_tier: "foundation",
          expires_at,
          created_by: appUser!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return row as Invitation;
    },
    onSuccess: (row) => {
      const link = `${window.location.origin}/invite/${row.token}`;
      navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Invitation created — link copied to clipboard");
      qc.invalidateQueries({ queryKey: ["adminInvitations"] });
      reset({ is_admin: false, expires_in_days: 30, full_name: "", email: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation revoked");
      qc.invalidateQueries({ queryKey: ["adminInvitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link).then(() => toast.success("Link copied"));
  };

  const buckets = {
    active: invitations.filter((i) => classify(i) === "active"),
    used: invitations.filter((i) => classify(i) === "used"),
    expired: invitations.filter((i) => classify(i) === "expired"),
    revoked: invitations.filter((i) => classify(i) === "revoked"),
  };

  if (!appUser?.is_admin) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">Invitations</h1>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">New invitation</h2>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="expires_in_days">Expires in (days)</Label>
              <Input id="expires_in_days" type="number" min={1} max={365} {...register("expires_in_days")} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_admin" className="cursor-pointer">Grant admin access</Label>
              <Switch
                id="is_admin"
                checked={watch("is_admin")}
                onCheckedChange={(v) => setValue("is_admin", v)}
              />
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create invitation"}
            </Button>
          </form>
        </Card>

        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active ({buckets.active.length})</TabsTrigger>
            <TabsTrigger value="used">Used ({buckets.used.length})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({buckets.expired.length})</TabsTrigger>
            <TabsTrigger value="revoked">Revoked ({buckets.revoked.length})</TabsTrigger>
          </TabsList>
          {(["active", "used", "expired", "revoked"] as const).map((k) => (
            <TabsContent key={k} value={k} className="space-y-2 pt-3">
              {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
              {!isLoading && buckets[k].length === 0 && (
                <p className="text-sm text-muted-foreground">No invitations.</p>
              )}
              {buckets[k].map((inv) => (
                <Card key={inv.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{inv.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {k === "active" && `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                      {k === "used" && inv.used_at && `Used ${new Date(inv.used_at).toLocaleDateString()}`}
                      {k === "expired" && `Expired ${new Date(inv.expires_at).toLocaleDateString()}`}
                      {k === "revoked" && inv.revoked_at && `Revoked ${new Date(inv.revoked_at).toLocaleDateString()}`}
                      {inv.is_admin && " · Admin"}
                    </p>
                  </div>
                  {k === "active" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => revokeMutation.mutate(inv.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}