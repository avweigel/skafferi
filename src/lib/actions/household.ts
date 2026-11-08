"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMembership, requireHousehold, requireUser } from "@/lib/household";
import { householdNameSchema, inviteSchema } from "@/lib/schemas/household";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createHousehold(formData: FormData): Promise<ActionResult> {
  const parsed = householdNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid name" };
  }
  const { supabase, user } = await requireUser();

  // the select policy on households only passes once you are a member, so
  // the id is minted here instead of read back from the insert.
  const id = crypto.randomUUID();
  const { error: hErr } = await supabase
    .from("households")
    .insert({ id, name: parsed.data.name, created_by: user.id });
  if (hErr) return { ok: false, error: hErr.message };

  const { error: mErr } = await supabase
    .from("household_members")
    .insert({ household_id: id, user_id: user.id, role: "owner" });
  if (mErr) return { ok: false, error: mErr.message };

  revalidatePath("/", "layout");
  redirect("/recipes");
}

export async function acceptInvite(inviteId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("accept_invite", { invite_id: inviteId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  redirect("/recipes");
}

export async function inviteMember(formData: FormData): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid email" };
  }
  const { supabase, user, householdId } = await requireHousehold();
  const { error } = await supabase.from("household_invites").insert({
    household_id: householdId,
    email: parsed.data.email,
    invited_by: user.id,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That email is already invited." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/household");
  return { ok: true };
}

export async function cancelInvite(inviteId: string): Promise<ActionResult> {
  const { supabase } = await requireHousehold();
  const { error } = await supabase.from("household_invites").delete().eq("id", inviteId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/household");
  return { ok: true };
}

export async function leaveHousehold(): Promise<ActionResult> {
  const { supabase, user, membership } = await getMembership();
  if (!membership) redirect("/household/new");
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("household_id", membership.household_id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  redirect("/household/new");
}
