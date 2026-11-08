"use client";

import { useState, useTransition } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirming(true)}>
        Delete recipe
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-secondary flex-1" onClick={() => setConfirming(false)}>
        Keep it
      </button>
      <button
        type="button"
        disabled={pending}
        className="btn btn-danger flex-1"
        onClick={() => start(() => deleteRecipe(recipeId))}
      >
        {pending ? "Deleting" : "Delete"}
      </button>
    </div>
  );
}
