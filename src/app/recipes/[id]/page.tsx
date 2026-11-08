import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/household";
import { PageHeader } from "@/components/page-header";
import type { Recipe, RecipeIngredientWithIngredient } from "@/lib/types";
import { ScaledIngredients } from "./scaled-ingredients";
import { DeleteRecipeButton } from "./delete-recipe-button";

export const metadata: Metadata = { title: "Recipe | Skafferi" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RecipePage({ params }: Props) {
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

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader
        back={{ href: "/recipes", label: "Recipes" }}
        title={recipe.title}
        subtitle={
          recipe.tags && recipe.tags.length > 0 ? (
            <span className="flex flex-wrap gap-1.5 pt-1">
              {recipe.tags.map((t) => (
                <span key={t} className="chip chip-accent">
                  {t}
                </span>
              ))}
            </span>
          ) : undefined
        }
        action={
          <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-secondary btn-sm">
            Edit
          </Link>
        }
      />

      <ScaledIngredients
        baseServings={recipe.servings}
        rows={rows.map((r) => ({
          id: r.id,
          name: r.ingredients?.name ?? "Unknown",
          name_sv: r.ingredients?.name_sv ?? null,
          quantity: r.quantity,
          unit: r.unit,
          note: r.note,
          in_pantry: r.ingredients?.in_pantry ?? false,
        }))}
      />

      {recipe.steps && (
        <section className="space-y-2">
          <h2 className="display px-1 text-[22px]">Method</h2>
          <div className="card whitespace-pre-wrap p-4 text-[15px] leading-relaxed">{recipe.steps}</div>
        </section>
      )}

      {recipe.notes && (
        <section className="space-y-2">
          <h2 className="display px-1 text-[22px]">Notes</h2>
          <div className="card whitespace-pre-wrap p-4 text-[15px] leading-relaxed">{recipe.notes}</div>
        </section>
      )}

      {recipe.source_url && (
        <p className="px-1 text-[14px] text-(--muted)">
          Source:{" "}
          <a href={recipe.source_url} target="_blank" rel="noreferrer" className="break-all text-(--accent) underline">
            {recipe.source_url}
          </a>
        </p>
      )}

      <DeleteRecipeButton recipeId={recipe.id} />
    </main>
  );
}
