import type { Metadata } from "next";
import { requireHousehold } from "@/lib/household";
import { PageHeader } from "@/components/page-header";
import { SECTION_LABELS, STORE_SECTIONS, type Ingredient } from "@/lib/types";
import { AddIngredientForm } from "./add-ingredient-form";
import { PantryRow } from "./pantry-row";

export const metadata: Metadata = { title: "Pantry | Skafferi" };
export const dynamic = "force-dynamic";

export default async function PantryPage() {
  const { supabase, householdId } = await requireHousehold();
  const { data } = await supabase
    .from("ingredients")
    .select("id, household_id, name, name_sv, section, in_pantry, created_at")
    .eq("household_id", householdId)
    .order("name");
  const ingredients = (data ?? []) as Ingredient[];
  const inPantry = ingredients.filter((i) => i.in_pantry).length;

  const grouped = STORE_SECTIONS.map((section) => ({
    section,
    items: ingredients.filter((i) => i.section === section),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader
        eyebrow="Skafferi"
        title="Pantry"
        subtitle={`${ingredients.length} ingredients, ${inPantry} marked as in stock. Stocked items are left off the shopping list.`}
      />

      <AddIngredientForm />

      {grouped.length === 0 ? (
        <p className="px-1 text-[15px] text-(--muted)">
          Nothing here yet. Ingredients show up as you add recipes.
        </p>
      ) : (
        grouped.map((g) => (
          <section key={g.section} className="space-y-2">
            <h2 className="label px-1 uppercase tracking-wide">{SECTION_LABELS[g.section]}</h2>
            <ul className="card divide-y divide-(--border)">
              {g.items.map((ing) => (
                <PantryRow key={ing.id} ingredient={ing} />
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
