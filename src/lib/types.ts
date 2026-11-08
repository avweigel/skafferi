export const STORE_SECTIONS = [
  "produce",
  "meat",
  "seafood",
  "dairy",
  "frozen",
  "bakery",
  "pantry",
  "spices",
  "canned",
  "beverages",
  "household",
  "other",
] as const;

export type StoreSection = (typeof STORE_SECTIONS)[number];

export const SECTION_LABELS: Record<StoreSection, string> = {
  produce: "Produce",
  meat: "Meat",
  seafood: "Seafood",
  dairy: "Dairy",
  frozen: "Frozen",
  bakery: "Bakery",
  pantry: "Pantry",
  spices: "Spices",
  canned: "Canned",
  beverages: "Beverages",
  household: "Household",
  other: "Other",
};

export function isStoreSection(value: string): value is StoreSection {
  return (STORE_SECTIONS as readonly string[]).includes(value);
}

export const PLAN_SLOTS = ["empty", "recipe", "eat_out", "leftovers"] as const;
export type PlanSlot = (typeof PLAN_SLOTS)[number];

export const SLOT_LABELS: Record<PlanSlot, string> = {
  empty: "Nothing planned",
  recipe: "Recipe",
  eat_out: "Eat out",
  leftovers: "Leftovers",
};

export type Household = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type HouseholdMember = {
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type HouseholdInvite = {
  id: string;
  household_id: string;
  email: string;
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
};

export type Ingredient = {
  id: string;
  household_id: string;
  name: string;
  name_sv: string | null;
  section: StoreSection;
  in_pantry: boolean;
  created_at: string;
};

export type Recipe = {
  id: string;
  household_id: string;
  title: string;
  servings: number;
  steps: string | null;
  source_url: string | null;
  source_text: string | null;
  tags: string[] | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  order_index: number;
};

export type RecipeIngredientWithIngredient = RecipeIngredient & {
  ingredients: Ingredient | null;
};

export type WeekPlan = {
  id: string;
  household_id: string;
  week_start: string;
};

export type PlanDay = {
  id: string;
  week_plan_id: string;
  day_of_week: number;
  slot: PlanSlot;
  recipe_id: string | null;
  servings: number | null;
  buy_day_of: boolean;
};

export type ShoppingItem = {
  id: string;
  week_plan_id: string;
  ingredient_id: string | null;
  name: string;
  name_sv: string | null;
  section: StoreSection;
  quantity: number | null;
  unit: string | null;
  for_days: number[] | null;
  buy_day_of: boolean;
  manual: boolean;
  checked: boolean;
  created_at: string;
};

export type SharedListRow = {
  name: string;
  name_sv: string | null;
  section: StoreSection;
  quantity: number | null;
  unit: string | null;
  for_days: number[] | null;
  buy_day_of: boolean;
  checked: boolean;
  week_start: string;
};
