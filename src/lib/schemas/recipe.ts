import { z } from "zod";
import { STORE_SECTIONS } from "@/lib/types";

export const sectionSchema = z.enum(STORE_SECTIONS);

const optionalText = z
  .string()
  .trim()
  .transform((s) => (s.length > 0 ? s : null))
  .nullable()
  .optional();

const optionalNumber = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().nonnegative().nullable());

export const recipeIngredientInputSchema = z.object({
  name: z.string().trim().min(1, "ingredient needs a name"),
  name_sv: optionalText,
  quantity: optionalNumber,
  unit: optionalText,
  section: sectionSchema,
  note: optionalText,
});

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1, "give the recipe a title"),
  servings: z.coerce.number().int().min(1, "at least one serving").max(100),
  tags: z.array(z.string().trim().min(1)).default([]),
  steps: optionalText,
  source_url: optionalText,
  source_text: optionalText,
  notes: optionalText,
  ingredients: z.array(recipeIngredientInputSchema).default([]),
});

export type RecipeIngredientInput = z.input<typeof recipeIngredientInputSchema>;
export type RecipeInput = z.input<typeof recipeInputSchema>;
export type RecipeParsed = z.output<typeof recipeInputSchema>;

// what the parse endpoint returns. the model is told to produce exactly this.
export const parsedRecipeSchema = z.object({
  title: z.string().trim().min(1),
  servings: z.number().int().min(1).max(100).catch(4),
  ingredients: z.array(
    z.object({
      name: z.string().trim().min(1),
      name_sv: z.string().trim().nullable().catch(null),
      quantity: z.number().nonnegative().nullable().catch(null),
      unit: z.string().trim().nullable().catch(null),
      section: sectionSchema.catch("other"),
      note: z.string().trim().nullable().catch(null),
    }),
  ),
  steps: z.string().catch(""),
});

export type ParsedRecipe = z.output<typeof parsedRecipeSchema>;
