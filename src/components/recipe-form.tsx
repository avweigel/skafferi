"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { createRecipe, updateRecipe } from "@/lib/actions/recipes";
import { recipeInputSchema, type RecipeInput } from "@/lib/schemas/recipe";
import { SECTION_LABELS, STORE_SECTIONS, type StoreSection } from "@/lib/types";

export type IngredientRowValues = {
  name: string;
  name_sv: string;
  quantity: string;
  unit: string;
  section: StoreSection;
  note: string;
};

export type RecipeFormValues = {
  title: string;
  servings: string;
  tags: string;
  steps: string;
  source_url: string;
  notes: string;
  ingredients: IngredientRowValues[];
};

export const emptyIngredientRow: IngredientRowValues = {
  name: "",
  name_sv: "",
  quantity: "",
  unit: "",
  section: "other",
  note: "",
};

export const emptyRecipeValues: RecipeFormValues = {
  title: "",
  servings: "4",
  tags: "",
  steps: "",
  source_url: "",
  notes: "",
  ingredients: [{ ...emptyIngredientRow }],
};

function toInput(values: RecipeFormValues, sourceText?: string | null): RecipeInput {
  return {
    title: values.title,
    servings: Number(values.servings),
    tags: values.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    steps: values.steps,
    source_url: values.source_url,
    source_text: sourceText ?? null,
    notes: values.notes,
    ingredients: values.ingredients
      .filter((row) => row.name.trim().length > 0)
      .map((row) => ({
        name: row.name,
        name_sv: row.name_sv,
        quantity: row.quantity,
        unit: row.unit,
        section: row.section,
        note: row.note,
      })),
  };
}

type Props = {
  defaultValues: RecipeFormValues;
  recipeId?: string;
  sourceText?: string | null;
};

export function RecipeForm({ defaultValues, recipeId, sourceText }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit } = useForm<RecipeFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });

  const onSubmit = (values: RecipeFormValues) => {
    setError(null);
    const input = toInput(values, sourceText);
    const check = recipeInputSchema.safeParse(input);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    start(async () => {
      const result = recipeId ? await updateRecipe(recipeId, input) : await createRecipe(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/recipes/${result.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="card space-y-3 p-4">
        <label className="block space-y-1.5">
          <span className="label">Title</span>
          <input type="text" className="field" placeholder="Weeknight dal" {...register("title", { required: true })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="label">Servings</span>
            <input type="number" inputMode="numeric" min={1} className="field" {...register("servings")} />
          </label>
          <label className="block space-y-1.5">
            <span className="label">Tags</span>
            <input type="text" className="field" placeholder="quick, veg" {...register("tags")} />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="label">Source URL</span>
          <input type="url" className="field" placeholder="https://" inputMode="url" {...register("source_url")} />
        </label>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="display text-[22px]">Ingredients</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => append({ ...emptyIngredientRow })}
          >
            <Plus size={16} aria-hidden /> Add row
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="card space-y-2 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field field-sm"
                  placeholder="Ingredient"
                  {...register(`ingredients.${i}.name` as const)}
                />
                <button
                  type="button"
                  aria-label="Remove ingredient"
                  className="btn btn-secondary btn-sm shrink-0 px-2.5"
                  onClick={() => remove(i)}
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
              <input
                type="text"
                className="field field-sm"
                placeholder="Swedish name (svenskt namn)"
                {...register(`ingredients.${i}.name_sv` as const)}
              />
              <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  className="field field-sm"
                  placeholder="Qty"
                  {...register(`ingredients.${i}.quantity` as const)}
                />
                <input
                  type="text"
                  className="field field-sm"
                  placeholder="Unit"
                  {...register(`ingredients.${i}.unit` as const)}
                />
                <select className="field field-sm" {...register(`ingredients.${i}.section` as const)}>
                  {STORE_SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {SECTION_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                className="field field-sm"
                placeholder="Note (diced, optional...)"
                {...register(`ingredients.${i}.note` as const)}
              />
            </div>
          ))}
          {fields.length === 0 && (
            <p className="px-1 text-[14px] text-(--muted)">No ingredients yet. Add a row.</p>
          )}
        </div>
      </section>

      <div className="card space-y-3 p-4">
        <label className="block space-y-1.5">
          <span className="label">Steps</span>
          <textarea className="field" rows={8} placeholder="1. ..." {...register("steps")} />
        </label>
        <label className="block space-y-1.5">
          <span className="label">Notes</span>
          <textarea className="field" rows={3} style={{ minHeight: "4.5rem" }} {...register("notes")} />
        </label>
      </div>

      {error && <p className="px-1 text-[14px] text-(--danger)">{error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "Saving" : recipeId ? "Save changes" : "Save recipe"}
      </button>
    </form>
  );
}
