import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireHousehold } from "@/lib/household";
import { ensureWeekPlan } from "@/lib/plan";
import { PageHeader } from "@/components/page-header";
import { addDays, currentWeekStart, formatWeekRange, resolveWeekParam } from "@/lib/dates";
import type { PlanDay, Recipe } from "@/lib/types";
import { PlanDayRow } from "./plan-day-row";
import { BuildListButton } from "./build-list-button";

export const metadata: Metadata = { title: "Plan | Skafferi" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ week?: string }> };

export default async function PlanPage({ searchParams }: Props) {
  const { week } = await searchParams;
  const weekStart = resolveWeekParam(week);
  const { supabase, householdId } = await requireHousehold();
  const plan = await ensureWeekPlan(supabase, householdId, weekStart);

  const [{ data: daysData }, { data: recipesData }] = await Promise.all([
    supabase
      .from("plan_days")
      .select("id, week_plan_id, day_of_week, slot, recipe_id, servings, buy_day_of")
      .eq("week_plan_id", plan.id),
    supabase
      .from("recipes")
      .select("id, title, servings")
      .eq("household_id", householdId)
      .order("title"),
  ]);
  const days = (daysData ?? []) as PlanDay[];
  const recipes = (recipesData ?? []) as Pick<Recipe, "id" | "title" | "servings">[];
  const byDay = new Map(days.map((d) => [d.day_of_week, d]));
  const isCurrent = weekStart === currentWeekStart();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader
        eyebrow={isCurrent ? "This week" : "Week plan"}
        title={formatWeekRange(weekStart)}
        action={
          <div className="flex gap-1">
            <Link
              href={`/plan?week=${addDays(weekStart, -7)}`}
              aria-label="Previous week"
              className="btn btn-secondary btn-sm px-2.5"
            >
              <ChevronLeft size={18} aria-hidden />
            </Link>
            <Link
              href={`/plan?week=${addDays(weekStart, 7)}`}
              aria-label="Next week"
              className="btn btn-secondary btn-sm px-2.5"
            >
              <ChevronRight size={18} aria-hidden />
            </Link>
          </div>
        }
      />

      {!isCurrent && (
        <Link href="/plan" className="inline-block px-1 text-[14px] font-medium text-(--accent)">
          Back to this week
        </Link>
      )}

      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
          <PlanDayRow key={`${weekStart}-${dow}`} weekStart={weekStart} dayOfWeek={dow} day={byDay.get(dow) ?? null} recipes={recipes} />
        ))}
      </div>

      <BuildListButton weekStart={weekStart} />
    </main>
  );
}
