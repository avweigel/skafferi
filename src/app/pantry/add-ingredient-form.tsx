"use client";

import { useRef, useState, useTransition } from "react";
import { addIngredient } from "@/lib/actions/pantry";
import { SECTION_LABELS, STORE_SECTIONS } from "@/lib/types";

export function AddIngredientForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary btn-block" onClick={() => setOpen(true)}>
        Add ingredient
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className="card space-y-3 p-4"
      action={(formData) => {
        setError(null);
        start(async () => {
          const result = await addIngredient(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          formRef.current?.reset();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <input name="name" type="text" required placeholder="Name" className="field" disabled={pending} />
        <input name="name_sv" type="text" placeholder="Svenskt namn" className="field" disabled={pending} />
      </div>
      <select name="section" className="field" defaultValue="other" disabled={pending}>
        {STORE_SECTIONS.map((s) => (
          <option key={s} value={s}>
            {SECTION_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="text-[14px] text-(--danger)">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Close
        </button>
        <button type="submit" disabled={pending} className="btn btn-primary flex-1">
          {pending ? "Adding" : "Add"}
        </button>
      </div>
    </form>
  );
}
