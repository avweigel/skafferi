import type { Db } from "@/lib/supabase/types";
import type { WeekPlan } from "@/lib/types";

// week_plans rows appear the first time anyone looks at a week
export async function ensureWeekPlan(
  supabase: Db,
  householdId: string,
  weekStart: string,
): Promise<WeekPlan> {
  const { data: found, error } = await supabase
    .from("week_plans")
    .select("id, household_id, week_start")
    .eq("household_id", householdId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (found) return found as WeekPlan;

  const { data: created, error: insErr } = await supabase
    .from("week_plans")
    .insert({ household_id: householdId, week_start: weekStart })
    .select("id, household_id, week_start")
    .single();
  if (insErr) {
    // two requests raced for the same week; the other one won
    if (insErr.code === "23505") {
      const { data: again } = await supabase
        .from("week_plans")
        .select("id, household_id, week_start")
        .eq("household_id", householdId)
        .eq("week_start", weekStart)
        .single();
      if (again) return again as WeekPlan;
    }
    throw new Error(insErr.message);
  }
  return created as WeekPlan;
}
