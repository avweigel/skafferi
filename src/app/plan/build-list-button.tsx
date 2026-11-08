"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildShoppingList } from "@/lib/actions/plan";

export function BuildListButton({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className="btn btn-primary btn-block"
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await buildShoppingList(weekStart);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(`/list?week=${weekStart}`);
          });
        }}
      >
        {pending ? "Building" : "Build shopping list"}
      </button>
      <p className="px-1 text-center text-[13px] text-(--muted)">
        Scales each recipe to its servings, skips what is in the pantry, and keeps anything you added by hand.
      </p>
      {error && <p className="px-1 text-center text-[14px] text-(--danger)">{error}</p>}
    </div>
  );
}
