import type { Metadata } from "next";
import { requireHousehold } from "@/lib/household";
import { PageHeader } from "@/components/page-header";
import { NewRecipeTabs } from "./new-recipe-tabs";

export const metadata: Metadata = { title: "New recipe | Skafferi" };
export const dynamic = "force-dynamic";

export default async function NewRecipePage() {
  await requireHousehold();
  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-4 pb-tabbar">
      <PageHeader back={{ href: "/recipes", label: "Recipes" }} title="New recipe" />
      <NewRecipeTabs />
    </main>
  );
}
