"use client";

import { useState } from "react";
import { formatQuantity, scaleQuantity } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  name_sv: string | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  in_pantry: boolean;
};

export function ScaledIngredients({ baseServings, rows }: { baseServings: number; rows: Row[] }) {
  const [servings, setServings] = useState(String(baseServings));
  const target = Number(servings);
  const factor = Number.isFinite(target) && target > 0 && baseServings > 0 ? target / baseServings : 1;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="display text-[22px]">Ingredients</h2>
        <label className="flex items-center gap-2 text-[14px] text-(--muted)">
          Servings
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="field field-sm w-16 text-center"
          />
        </label>
      </div>
      <ul className="card divide-y divide-(--border)">
        {rows.length === 0 && <li className="p-4 text-[14px] text-(--muted)">No ingredients.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex items-baseline gap-3 px-4 py-2.5">
            <span className="num w-20 shrink-0 text-[15px]">
              {formatQuantity(scaleQuantity(r.quantity, factor), r.unit)}
            </span>
            <span className="min-w-0 flex-1 text-[15px]">
              {r.name}
              {r.name_sv && <span className="text-(--muted)"> ({r.name_sv})</span>}
              {r.note && <span className="block text-[13px] text-(--muted)">{r.note}</span>}
            </span>
            {r.in_pantry && <span className="chip chip-ok shrink-0">pantry</span>}
          </li>
        ))}
      </ul>
      {factor !== 1 && (
        <p className="px-1 text-[13px] text-(--muted)">
          Scaled from {baseServings} to {target} servings.
        </p>
      )}
    </section>
  );
}
