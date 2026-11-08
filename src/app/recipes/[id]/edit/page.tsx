import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/household";
import { PageHeader } from "@/components/page-header";
import { RecipeForm, type RecipeFormValues } from "@/components/recipe-form";
import type { Recipe, RecipeIngredientWithIngredient } from "@/lib/types";

export const metadata: Metadata = { title: "Edit recipe | Skafferi" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const { supabase, householdId } = await requireHousehold();

  const { data: recipeData } = await supabase
    .from("recipes")
    .select("id, household_id, title, servings, steps, source_url, source_text, tags, notes, created_by, created_at, updated_at")
    .eq("id", id)
    .eq("household_id", householdId)
    .maybeSingle();
  const recipe = recipeData as Recipe | null;
  if (!recipe) notFound();

  const { data: riData } = await supabase
    .from("recipe_ingredients")
    .select("id, recipe_id, ingredient_id, quantity, unit, note, order_index, ingredients(id, household_id, name, name_sv, section, in_pantry, created_at)")
    .eq("recipe_id", id)
    .order("order_index");
  const rows = (riData ?? []) as unknown as RecipeIngredientWithIngredient[];

  const defaults: RecipeFormValues = {
    title: recipe.title,
    servings: String(recipe.servings),
    tags: (recipe.tags ?? []).join(", "),
    steps: recipe.steps ?? "",
    source_url: recipe.source_url ?? "",
    notes: recipe.notes ?? "",
    ingredients: rows.map((r) => ({
      name: r.ingredients?.name ?? "",
      name_sv: r.ingredients?.name_sv ?? "",
      quantity: r.quantity === null ? "" : String(r.quantity),
      unit: r.unit ?? "",
      section: r.ingredients?.section ?? "other",
      note: r.note ?? "",
    })),
  };

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader back={{ href: `/recipes/${recipe.id}`, label: recipe.title }} title="Edit recipe" />
      <RecipeForm defaultValues={defaults} recipeId={recipe.id} sourceText={recipe.source_text} />
    </main>
  );
}
