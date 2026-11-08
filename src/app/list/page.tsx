import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireHousehold } from "@/lib/household";
import { ensureWeekPlan } from "@/lib/plan";
import { PageHeader } from "@/components/page-header";
import { addDays, currentWeekStart, formatWeekRange, resolveWeekParam } from "@/lib/dates";
import type { ShoppingItem } from "@/lib/types";
import { ShoppingList } from "./shopping-list";

export const metadata: Metadata = { title: "List | Skafferi" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ week?: string }> };

export default async function ListPage({ searchParams }: Props) {
  const { week } = await searchParams;
  const weekStart = resolveWeekParam(week);
  const { supabase, householdId } = await requireHousehold();
  const plan = await ensureWeekPlan(supabase, householdId, weekStart);

  const [{ data: itemsData }, { data: shareData }] = await Promise.all([
    supabase
      .from("shopping_items")
      .select("id, week_plan_id, ingredient_id, name, name_sv, section, quantity, unit, for_days, buy_day_of, manual, checked, created_at")
      .eq("week_plan_id", plan.id)
      .order("name"),
    supabase.from("share_links").select("token").eq("week_plan_id", plan.id).limit(1).maybeSingle(),
  ]);
  const items = (itemsData ?? []) as ShoppingItem[];
  const shareToken = (shareData as { token: string } | null)?.token ?? null;
  const isCurrent = weekStart === currentWeekStart();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader
        eyebrow={isCurrent ? "This week" : "Shopping list"}
        title={formatWeekRange(weekStart)}
        action={
          <div className="flex gap-1">
            <Link href={`/list?week=${addDays(weekStart, -7)}`} aria-label="Previous week" className="btn btn-secondary btn-sm px-2.5">
              <ChevronLeft size={18} aria-hidden />
            </Link>
            <Link href={`/list?week=${addDays(weekStart, 7)}`} aria-label="Next week" className="btn btn-secondary btn-sm px-2.5">
              <ChevronRight size={18} aria-hidden />
            </Link>
          </div>
        }
      />

      <ShoppingList
        key={weekStart}
        weekStart={weekStart}
        items={items}
        initialShareToken={shareToken}
      />
    </main>
  );
}
