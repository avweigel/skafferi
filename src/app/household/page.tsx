import type { Metadata } from "next";
import { requireHousehold } from "@/lib/household";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { SignOutButton } from "@/components/sign-out-button";
import type { HouseholdInvite, HouseholdMember } from "@/lib/types";
import { InviteForm } from "./invite-form";
import { CancelInviteButton, LeaveHouseholdButton } from "./household-buttons";

export const metadata: Metadata = { title: "Household | Skafferi" };
export const dynamic = "force-dynamic";

export default async function HouseholdPage() {
  const { supabase, user, household, householdId } = await requireHousehold();

  const [{ data: membersData }, { data: invitesData }] = await Promise.all([
    supabase
      .from("household_members")
      .select("household_id, user_id, role, joined_at")
      .eq("household_id", householdId)
      .order("joined_at"),
    supabase
      .from("household_invites")
      .select("id, household_id, email, invited_by, created_at, accepted_at")
      .eq("household_id", householdId)
      .is("accepted_at", null)
      .order("created_at"),
  ]);
  const members = (membersData ?? []) as HouseholdMember[];
  const invites = (invitesData ?? []) as HouseholdInvite[];

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader eyebrow="Household" title={household.name} subtitle={`Signed in as ${user.email ?? "you"}`} />

      <section className="space-y-2">
        <SectionTitle>Members</SectionTitle>
        <div className="card divide-y divide-(--border)">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-medium">
                  {m.user_id === user.id ? (user.email ?? "You") : `Member ${m.user_id.slice(0, 8)}`}
                </div>
                <div className="text-[12px] text-(--muted)">
                  {m.user_id === user.id ? "You" : "Joined"} {m.user_id === user.id ? "" : m.joined_at.slice(0, 10)}
                </div>
              </div>
              <span className={`chip ${m.role === "owner" ? "chip-accent" : ""}`}>{m.role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle>Invite someone</SectionTitle>
        <InviteForm />
        {invites.length > 0 && (
          <div className="card divide-y divide-(--border)">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-medium">{inv.email}</div>
                  <div className="text-[12px] text-(--muted)">Pending. They accept after signing in with this email.</div>
                </div>
                <CancelInviteButton inviteId={inv.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 pt-2">
        <LeaveHouseholdButton />
        <SignOutButton className="btn btn-secondary btn-block" />
      </section>
    </main>
  );
}
