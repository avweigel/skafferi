# CLAUDE.md, skafferi

Context for Claude Code when working on this repo. Read this first before making changes.

## What this is

Skafferi is a household recipe, pantry and weekly shopping list app. One household, a few people, shared data. Paste a recipe and an LLM turns it into ingredients with Swedish store names. Plan the week, build the list, tick things off in the shop. Scope is small on purpose.

## Tech stack

- **Next.js 16** (App Router). Server Components by default. Client Components only for interactivity, state, or browser APIs.
- **TypeScript** strict mode. No `any`.
- **Tailwind v4** utility-first. Design tokens live in `src/styles/globals.css`. No other CSS files.
- **Supabase**: Postgres, Auth (magic link + Google OAuth), RLS everywhere. All tables live in the `skafferi` schema and the clients are pinned to it.
- **Zod** validates all external input (form data, server action arguments, API routes, the parser output).
- **React Hook Form** for the recipe form.
- **@anthropic-ai/sdk** for `/api/recipes/parse` (model `claude-sonnet-4-5`).
- **lucide-react** for icons.

## Auth

- Magic link email (`signInWithOtp`) and Google OAuth. Configured on the Supabase side.
- Session refresh runs in `src/proxy.ts` via `src/lib/supabase/middleware.ts`. Unauthenticated users are sent to `/login` except for `/`, `/login`, `/auth/callback`, `/share/*` and `/api/*`.
- Server components and actions get the user through `createClient()` in `src/lib/supabase/server.ts`. Client components use `src/lib/supabase/client.ts`.
- `src/lib/household.ts` has `requireUser()`, `getMembership()` and `requireHousehold()`. Every household page calls `requireHousehold()`, which redirects to `/household/new` when the user has no membership.

## Directory conventions

```
src/
├── app/                 # routes (server components default)
│   ├── api/recipes/parse/route.ts
│   ├── auth/callback/route.ts
│   ├── household/       # settings, and new/ for onboarding
│   ├── list/            # shopping list
│   ├── login/
│   ├── pantry/
│   ├── plan/            # week view
│   ├── recipes/         # list, new, [id], [id]/edit
│   └── share/[token]/   # public read-only list
├── components/          # shared ui: nav, tab-bar, page-header, recipe-form
├── lib/
│   ├── actions/         # server actions, one file per area
│   ├── schemas/         # zod schemas
│   ├── supabase/        # client, server, middleware (do not edit casually)
│   ├── dates.ts         # week math on YYYY-MM-DD strings, Monday first
│   ├── household.ts     # auth + membership helpers
│   ├── list-groups.ts   # grouping and plain text export for the list
│   ├── plan.ts          # ensureWeekPlan
│   └── types.ts         # row types and enums
└── styles/globals.css
```

Page-specific client components sit next to their page (for example `src/app/plan/plan-day-row.tsx`).

## Data model (already deployed, schema `skafferi`)

- `households` (id, name, created_by, created_at)
- `household_members` (household_id, user_id, role owner|member, joined_at), pk (household_id, user_id)
- `household_invites` (id, household_id, email, invited_by, created_at, accepted_at), unique (household_id, email)
- `ingredients` (id, household_id, name, name_sv, section store_section, in_pantry, created_at), unique (household_id, name)
- `recipes` (id, household_id, title, servings, steps, source_url, source_text, tags text[], notes, created_by, created_at, updated_at)
- `recipe_ingredients` (id, recipe_id, ingredient_id, quantity numeric, unit, note, order_index)
- `week_plans` (id, household_id, week_start date), unique (household_id, week_start)
- `plan_days` (id, week_plan_id, day_of_week 0-6 where 0 = Monday, slot plan_slot, recipe_id, servings, buy_day_of), unique (week_plan_id, day_of_week)
- `shopping_items` (id, week_plan_id, ingredient_id nullable, name, name_sv, section, quantity, unit, for_days smallint[], buy_day_of, manual, checked, created_at)
- `share_links` (token text pk, week_plan_id, created_at)

Enums:

- `store_section`: produce, meat, seafood, dairy, frozen, bakery, pantry, spices, canned, beverages, household, other
- `plan_slot`: recipe, eat_out, leftovers, empty

RPCs:

- `accept_invite(invite_id uuid)` returns household_id. Called by the invitee.
- `shared_list(p_token text)` returns the list rows for a share link. Callable by anon; the share page uses a plain anon client with no cookies.

## RLS rules (already enforced)

Everything is household scoped through `skafferi.is_member(household_id)`. Child tables (plan_days, recipe_ingredients, shopping_items, share_links) check membership through their parent. Two details matter in code:

- `households` SELECT only passes for members, so `createHousehold` mints the uuid client-side, inserts the household, then inserts the owner membership. Do not `.select()` on that insert.
- `household_invites` SELECT also passes when the invite email matches the signed-in user's email. That is how onboarding lists pending invites.

Don't add service role key calls to get around any of this.

## Key flows

- **Recipe save** (`src/lib/actions/recipes.ts`): ingredients are matched case-insensitively against the household's existing names, missing ones are inserted, then the recipe and its `recipe_ingredients` rows are written. Editing deletes and rewrites the ingredient rows.
- **Parse** (`src/app/api/recipes/parse/route.ts`): POST `{ text }`, returns `{ title, servings, ingredients[], steps }` validated by `parsedRecipeSchema`. Returns 503 when `ANTHROPIC_API_KEY` is missing. US units are converted to metric in the prompt.
- **Week plan** (`src/lib/actions/plan.ts`): one `plan_days` row per day, upserted on (week_plan_id, day_of_week). `ensureWeekPlan` creates the `week_plans` row on first visit.
- **List builder** (`buildShoppingList`): for each recipe day, scale quantities by servings / recipe.servings, aggregate by ingredient and unit, skip `in_pantry` ingredients, record `for_days` and `buy_day_of`. Non-manual items are replaced; manual items stay; checked state is carried over by ingredient_id.
- **List page**: "Weekend shop" and "Buy day of" groups, each grouped by section, checked items collapse into "Done". Toggling is optimistic (`useOptimistic`) with a server action behind it.

## Dates

Weeks start on Monday. `src/lib/dates.ts` works on `YYYY-MM-DD` strings in UTC so the server timezone never moves a day. Labels are Mon..Sun and dates render like "Nov 10". Units are metric.

## Writing style (README, docs, UI copy, commit messages, code comments)

- No em dashes. Use commas, periods, or parentheses. This is non-negotiable.
- No corporate jargon: no "leverage," "empower," "unlock," "seamless," "robust."
- No AI-tell phrases: no "delve into," "in today's fast-paced world," "it's important to note," "let's explore."
- Direct and human. Active voice. Short sentences. American English.
- Prose, not bullet soup, when explaining things.
- Commit messages: lowercase, imperative mood. "add pantry toggle" not "Added pantry toggle" or "Feat: Pantry Toggle."

## What NOT to do

- Don't use the service role key anywhere.
- Don't bypass RLS for user queries.
- Don't edit `src/lib/supabase/*`, `src/proxy.ts` or `.env.local` without a reason.
- Don't store app state in `localStorage`. Supabase session cookies only.
- Don't use `any` to silence type errors. Fix the real issue.
- Don't add a password reset flow. Magic link + Google OAuth only.
- Don't add em dashes to anything you write.
- Don't add comments that describe what the code does. Comments explain why.
- Don't invent features not in the spec. Ask first.
