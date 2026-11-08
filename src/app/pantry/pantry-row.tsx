"use client";

import { useState, useTransition } from "react";
import { toggleInPantry, updateSwedishName } from "@/lib/actions/pantry";
import type { Ingredient } from "@/lib/types";

export function PantryRow({ ingredient }: { ingredient: Ingredient }) {
  const [checked, setChecked] = useState(ingredient.in_pantry);
  const [nameSv, setNameSv] = useState(ingredient.name_sv ?? "");
  const [saved, setSaved] = useState(ingredient.name_sv ?? "");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    start(async () => {
      const result = await toggleInPantry(ingredient.id, next);
      if (!result.ok) {
        setChecked(!next);
        setError(result.error);
      }
    });
  };

  const commitName = () => {
    if (nameSv.trim() === saved.trim()) return;
    start(async () => {
      const result = await updateSwedishName(ingredient.id, nameSv);
      if (result.ok) setSaved(nameSv.trim());
      else setError(result.error);
    });
  };

  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          className="check"
          checked={checked}
          onChange={toggle}
          aria-label={`${ingredient.name} in pantry`}
        />
      </label>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{ingredient.name}</div>
        <input
          type="text"
          value={nameSv}
          onChange={(e) => setNameSv(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="svenskt namn"
          aria-label={`Swedish name for ${ingredient.name}`}
          className="h-8 w-full bg-transparent text-[14px] text-(--muted) outline-none placeholder:text-(--faint) focus:text-(--foreground)"
        />
        {error && <div className="text-[12px] text-(--danger)">{error}</div>}
      </div>
      {checked && <span className="chip chip-ok shrink-0">in stock</span>}
    </li>
  );
}
