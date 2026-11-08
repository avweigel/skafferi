"use client";

import { useState, useTransition } from "react";
import { savePlanDay } from "@/lib/actions/plan";
import { DAY_LABELS, dayDate, formatShort } from "@/lib/dates";
import { PLAN_SLOTS, SLOT_LABELS, type PlanDay, type PlanSlot, type Recipe } from "@/lib/types";

type RecipeOption = Pick<Recipe, "id" | "title" | "servings">;

type Props = {
  weekStart: string;
  dayOfWeek: number;
  day: PlanDay | null;
  recipes: RecipeOption[];
};

type State = {
  slot: PlanSlot;
  recipeId: string | null;
  servings: string;
  buyDayOf: boolean;
};

export function PlanDayRow({ weekStart, dayOfWeek, day, recipes }: Props) {
  const [state, setState] = useState<State>({
    slot: day?.slot ?? "empty",
    recipeId: day?.recipe_id ?? null,
    servings: day?.servings ? String(day.servings) : "",
    buyDayOf: day?.buy_day_of ?? false,
  });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const recipe = recipes.find((r) => r.id === state.recipeId) ?? null;

  const persist = (next: State) => {
    setState(next);
    setError(null);
    // a recipe slot without a chosen recipe is not worth saving yet
    if (next.slot === "recipe" && !next.recipeId) return;
    const servings = Number(next.servings);
    start(async () => {
      const result = await savePlanDay({
        weekStart,
        dayOfWeek,
        slot: next.slot,
        recipeId: next.slot === "recipe" ? next.recipeId : null,
        servings:
          next.slot === "recipe"
            ? Number.isFinite(servings) && servings > 0
              ? Math.round(servings)
              : recipes.find((r) => r.id === next.recipeId)?.servings ?? null
            : null,
        buyDayOf: next.slot === "recipe" ? next.buyDayOf : false,
      });
      if (!result.ok) setError(result.error);
    });
  };

  const onSlotChange = (slot: PlanSlot) => {
    if (slot === "recipe") {
      const first = state.recipeId ?? recipes[0]?.id ?? null;
      const chosen = recipes.find((r) => r.id === first);
      persist({ ...state, slot, recipeId: first, servings: state.servings || (chosen ? String(chosen.servings) : "") });
    } else {
      persist({ ...state, slot });
    }
  };

  const onRecipeChange = (recipeId: string) => {
    const chosen = recipes.find((r) => r.id === recipeId);
    persist({ ...state, recipeId, servings: chosen ? String(chosen.servings) : state.servings });
  };

  return (
    <div className={`card space-y-2 p-3 ${pending ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="w-14 shrink-0">
          <div className="text-[15px] font-semibold">{DAY_LABELS[dayOfWeek]}</div>
          <div className="text-[12px] text-(--muted)">{formatShort(dayDate(weekStart, dayOfWeek))}</div>
        </div>
        <select
          value={state.slot}
          onChange={(e) => onSlotChange(e.target.value as PlanSlot)}
          aria-label={`${DAY_LABELS[dayOfWeek]} plan`}
          className="field field-sm flex-1"
        >
          {PLAN_SLOTS.map((s) => (
            <option key={s} value={s} disabled={s === "recipe" && recipes.length === 0}>
              {SLOT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {state.slot === "recipe" && (
        <div className="space-y-2 pl-[calc(3.5rem+0.75rem)]">
          <select
            value={state.recipeId ?? ""}
            onChange={(e) => onRecipeChange(e.target.value)}
            aria-label="Recipe"
            className="field field-sm"
          >
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[14px] text-(--muted)">
              Servings
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={state.servings}
                placeholder={recipe ? String(recipe.servings) : ""}
                onChange={(e) => setState({ ...state, servings: e.target.value })}
                onBlur={() => persist(state)}
                className="field field-sm w-16 text-center"
              />
            </label>
            <label className="flex h-10 flex-1 items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                className="check"
                checked={state.buyDayOf}
                onChange={(e) => persist({ ...state, buyDayOf: e.target.checked })}
              />
              Buy day of
            </label>
          </div>
        </div>
      )}
      {error && <p className="text-[13px] text-(--danger)">{error}</p>}
    </div>
  );
}
