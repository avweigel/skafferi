import type { Metadata } from "next";
import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { PageHeader } from "@/components/page-header";
import type { Recipe } from "@/lib/types";

export const metadata: Metadata = { title: "Recipes | Skafferi" };
export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const { supabase, householdId } = await requireHousehold();
  const { data } = await supabase
    .from("recipes")
    .select("id, household_id, title, servings, steps, source_url, source_text, tags, notes, created_by, created_at, updated_at")
    .eq("household_id", householdId)
    .order("title");
  const recipes = (data ?? []) as Recipe[];

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader
        eyebrow="Skafferi"
        title="Recipes"
        subtitle={recipes.length === 1 ? "1 recipe" : `${recipes.length} recipes`}
        action={
          <Link href="/recipes/new" className="btn btn-primary btn-sm">
            New recipe
          </Link>
        }
      />

      {recipes.length === 0 ? (
        <div className="card space-y-3 p-5">
          <p className="text-[15px] text-(--muted)">
            No recipes yet. Paste one from anywhere and the parser will sort out the ingredients.
          </p>
          <Link href="/recipes/new" className="btn btn-primary btn-block">
            Add the first recipe
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {recipes.map((r) => (
            <li key={r.id}>
              <Link href={`/recipes/${r.id}`} className="card block space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[17px] font-semibold leading-tight">{r.title}</span>
                  <span className="chip shrink-0">{r.servings} serv.</span>
                </div>
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <span key={t} className="chip chip-accent">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
