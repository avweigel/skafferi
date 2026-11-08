import { z } from "zod";
import { PLAN_SLOTS } from "@/lib/types";
import { sectionSchema } from "@/lib/schemas/recipe";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "bad date");

export const planDaySchema = z.object({
  weekStart: isoDate,
  dayOfWeek: z.number().int().min(0).max(6),
  slot: z.enum(PLAN_SLOTS),
  recipeId: z.string().uuid().nullable(),
  servings: z.number().int().min(1).max(100).nullable(),
  buyDayOf: z.boolean(),
});

export type PlanDayInput = z.infer<typeof planDaySchema>;

export const manualItemSchema = z.object({
  weekStart: isoDate,
  name: z.string().trim().min(1, "name is required").max(120),
  quantity: z.preprocess((v) => {
    if (v === "" || v === undefined || v === null) return null;
    const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
    return Number.isFinite(n) ? n : v;
  }, z.number().nonnegative().nullable()),
  unit: z
    .string()
    .trim()
    .max(20)
    .transform((s) => (s.length > 0 ? s : null)),
  section: sectionSchema.default("other"),
});

export type ManualItemInput = z.input<typeof manualItemSchema>;
