import { z } from "zod";
import { sectionSchema } from "@/lib/schemas/recipe";

export const newIngredientSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  name_sv: z
    .string()
    .trim()
    .max(120)
    .transform((s) => (s.length > 0 ? s : null)),
  section: sectionSchema,
});

export type NewIngredientInput = z.input<typeof newIngredientSchema>;
