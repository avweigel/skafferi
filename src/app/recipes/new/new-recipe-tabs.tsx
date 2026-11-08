"use client";

import { useState } from "react";
import { RecipeForm, emptyRecipeValues, type RecipeFormValues } from "@/components/recipe-form";
import type { ParsedRecipe } from "@/lib/schemas/recipe";

type Mode = "paste" | "manual";

function parsedToValues(parsed: ParsedRecipe): RecipeFormValues {
  return {
    title: parsed.title,
    servings: String(parsed.servings),
    tags: "",
    steps: parsed.steps,
    source_url: "",
    notes: "",
    ingredients: parsed.ingredients.map((ing) => ({
      name: ing.name,
      name_sv: ing.name_sv ?? "",
      quantity: ing.quantity === null ? "" : String(ing.quantity),
      unit: ing.unit ?? "",
      section: ing.section,
      note: ing.note ?? "",
    })),
  };
}

export function NewRecipeTabs() {
  const [mode, setMode] = useState<Mode>("paste");
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<RecipeFormValues | null>(null);

  const parse = async () => {
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as ParsedRecipe | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : "Parsing failed.");
        return;
      }
      setParsed(parsedToValues(json));
    } catch {
      setError("Could not reach the parser.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-(--radius-btn) bg-(--surface-2) p-1">
        {(["paste", "manual"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`h-10 rounded-[11px] text-[14px] font-semibold transition-colors ${
              mode === m ? "bg-(--surface) text-(--foreground) shadow-sm" : "text-(--muted)"
            }`}
          >
            {m === "paste" ? "Paste" : "Manual"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        parsed ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[14px] text-(--muted)">Check what the parser found, then save.</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParsed(null)}>
                Back to text
              </button>
            </div>
            <RecipeForm key="parsed" defaultValues={parsed} sourceText={text} />
          </div>
        ) : (
          <div className="card space-y-3 p-4">
            <label className="block space-y-1.5">
              <span className="label">Recipe text</span>
              <textarea
                className="field"
                rows={12}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the whole recipe here: title, ingredients and method."
                disabled={parsing}
              />
            </label>
            {error && <p className="text-[14px] text-(--danger)">{error}</p>}
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={parsing || text.trim().length < 10}
              onClick={parse}
            >
              {parsing ? "Parsing" : "Parse"}
            </button>
            <p className="text-[13px] text-(--muted)">
              Quantities are converted to metric and each ingredient gets its Swedish store name.
            </p>
          </div>
        )
      ) : (
        <RecipeForm key="manual" defaultValues={emptyRecipeValues} />
      )}
    </div>
  );
}
