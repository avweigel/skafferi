import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { PageHeader } from "@/components/page-header";
import { currentWeekStart, DAY_LABELS, dayDate, formatShort, formatWeekRange } from "@/lib/dates";
import { SLOT_LABELS, type PlanDay, type Recipe, type WeekPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

type DayRow = PlanDay & { recipes: Pick<Recipe, "id" | "title"> | null };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { householdId, household } = await requireHousehold();
  const weekStart = currentWeekStart();

  const { data: planData } = await supabase
    .from("week_plans")
    .select("id, household_id, week_start")
    .eq("household_id", householdId)
    .eq("week_start", weekStart)
    .maybeSingle();
  const plan = planData as WeekPlan | null;

  let days: DayRow[] = [];
  let itemCount = 0;
  let checkedCount = 0;
  if (plan) {
    const { data } = await supabase
      .from("plan_days")
      .select("id, week_plan_id, day_of_week, slot, recipe_id, servings, buy_day_of, recipes(id, title)")
      .eq("week_plan_id", plan.id)
      .order("day_of_week");
    days = ((data ?? []) as unknown as DayRow[]).filter((d) => d.slot !== "empty");
    const { data: items } = await supabase
      .from("shopping_items")
      .select("id, checked")
      .eq("week_plan_id", plan.id);
    const list = (items ?? []) as { id: string; checked: boolean }[];
    itemCount = list.length;
    checkedCount = list.filter((i) => i.checked).length;
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader
        eyebrow={household.name}
        title="This week"
        subtitle={formatWeekRange(weekStart)}
        action={
          <Link href={`/plan?week=${weekStart}`} className="btn btn-secondary btn-sm">
            Edit plan
          </Link>
        }
      />

      <section className="card divide-y divide-(--border)">
        {days.length === 0 ? (
          <div className="space-y-3 p-5">
            <p className="text-[15px] text-(--muted)">Nothing planned yet.</p>
            <Link href={`/plan?week=${weekStart}`} className="btn btn-primary btn-block">
              Plan the week
            </Link>
          </div>
        ) : (
          days.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-14 shrink-0">
                <div className="text-[15px] font-semibold">{DAY_LABELS[d.day_of_week]}</div>
                <div className="text-[12px] text-(--muted)">{formatShort(dayDate(weekStart, d.day_of_week))}</div>
              </div>
              <div className="min-w-0 flex-1">
                {d.slot === "recipe" && d.recipes ? (
                  <Link href={`/recipes/${d.recipes.id}`} className="block truncate text-[15px] font-medium">
                    {d.recipes.title}
                  </Link>
                ) : (
                  <span className="text-[15px] text-(--muted)">{SLOT_LABELS[d.slot]}</span>
                )}
                {d.slot === "recipe" && (
                  <div className="text-[12px] text-(--muted)">
                    {d.servings} servings{d.buy_day_of ? ", buy day of" : ""}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <Link href={`/list?week=${weekStart}`} className="card flex items-center justify-between gap-3 p-4">
        <div>
          <div className="text-[16px] font-semibold">Shopping list</div>
          <div className="text-[13px] text-(--muted)">
            {itemCount === 0
              ? "No items yet. Build it from the plan."
              : `${checkedCount} of ${itemCount} done`}
          </div>
        </div>
        <span className="chip chip-accent">Open</span>
      </Link>
    </main>
  );
}
