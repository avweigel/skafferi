# Skafferi

Recipes, pantry and the weekly shopping list for one household. Paste a recipe, plan the week, build the list, shop. Everything is shared with whoever is in the household.

Skafferi is Swedish for pantry. Ingredients carry a Swedish store name next to the English one so the list reads fine in an ICA aisle.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000. Sign in with Google or an email link, create a household (or accept an invite), and add a recipe.

## Environment

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. Row level security does the rest. |
| `ANTHROPIC_API_KEY` | Used only by `/api/recipes/parse`. Leave it empty and the Paste tab tells you parsing is off; Manual entry still works. |

There is no service role key in this app and it does not need one.

## Scripts

- `npm run dev` starts the dev server
- `npm run lint` runs eslint
- `npm run build` builds for production

## Stack

Next.js (App Router), TypeScript, Tailwind v4, Supabase (Postgres, Auth, RLS) in the `skafferi` schema, Zod, React Hook Form, and the Anthropic SDK for recipe parsing. See `CLAUDE.md` for the data model and conventions.
