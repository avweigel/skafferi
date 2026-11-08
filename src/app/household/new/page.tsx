import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { PageHeader } from "@/components/page-header";
import { SignOutButton } from "@/components/sign-out-button";
import type { Household, HouseholdInvite } from "@/lib/types";
import { CreateHouseholdForm } from "./create-household-form";
import { AcceptInviteButton } from "./accept-invite-button";

export const metadata: Metadata = { title: "New household | Skafferi" };
export const dynamic = "force-dynamic";

type InviteRow = HouseholdInvite & { households: Pick<Household, "name"> | null };

export default async function NewHouseholdPage() {
  const { supabase, user, membership } = await getMembership();
  if (membership) redirect("/household");

  const email = user.email?.toLowerCase();
  let invites: InviteRow[] = [];
  if (email) {
    const { data } = await supabase
      .from("household_invites")
      .select("id, household_id, email, invited_by, created_at, accepted_at, households(name)")
      .eq("email", email)
      .is("accepted_at", null);
    invites = (data ?? []) as unknown as InviteRow[];
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader
        eyebrow="Skafferi"
        title="Your household"
        subtitle="Recipes, pantry and the shopping list are shared with everyone in the household."
      />

      {invites.length > 0 && (
        <section className="space-y-2">
          <h2 className="label px-1">Invites for {email}</h2>
          <div className="card divide-y divide-(--border)">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-semibold">
                    {inv.households?.name ?? "A household"}
                  </div>
                  <div className="text-[13px] text-(--muted)">Join as a member</div>
                </div>
                <AcceptInviteButton inviteId={inv.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="label px-1">{invites.length > 0 ? "Or start a new one" : "Start a household"}</h2>
        <CreateHouseholdForm />
      </section>

      <SignOutButton className="btn btn-ghost btn-block" />
    </main>
  );
}
