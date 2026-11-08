"use client";

import { useState, useTransition } from "react";
import { createHousehold } from "@/lib/actions/household";

export function CreateHouseholdForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card space-y-3 p-4"
      action={(formData) => {
        setError(null);
        start(async () => {
          const result = await createHousehold(formData);
          if (result && !result.ok) setError(result.error);
        });
      }}
    >
      <label className="block space-y-1.5">
        <span className="label">Household name</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="off"
          placeholder="Weigel kitchen"
          className="field"
          disabled={pending}
        />
      </label>
      {error && <p className="text-[14px] text-(--danger)">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "Creating" : "Create household"}
      </button>
    </form>
  );
}
