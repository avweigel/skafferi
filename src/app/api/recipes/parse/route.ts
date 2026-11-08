import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parsedRecipeSchema } from "@/lib/schemas/recipe";
import { STORE_SECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  text: z.string().trim().min(10, "paste a bit more of the recipe").max(20000),
});

const SYSTEM_PROMPT = `You turn pasted recipe text into structured JSON for a Swedish household's shopping app.

Return ONLY a JSON object, no prose, no code fences, with exactly these keys:
{
  "title": string,
  "servings": integer (default 4 if the text does not say),
  "ingredients": [
    {
      "name": string (the ingredient in plain English, singular, lowercase, no quantity, no preparation words),
      "name_sv": string | null (the name a Swedish grocery store uses for it, e.g. chicken breast -> kycklingbröstfilé, cherry tomatoes -> körsbärstomater, cornstarch -> majsstärkelse, heavy cream -> vispgrädde, ground beef -> nötfärs, scallions -> salladslök),
      "quantity": number | null,
      "unit": string | null (metric: g, kg, ml, dl, l, tsp, tbsp, or a count word like "pcs", "clove", "can", "bunch"),
      "section": one of ${STORE_SECTIONS.map((s) => `"${s}"`).join(", ")},
      "note": string | null (preparation notes like "diced" or "room temperature", or an alternative)
    }
  ],
  "steps": string (the method as numbered lines separated by newlines, cleaned up but not shortened)
}

Rules:
- Convert US units to metric where it is obvious: lb -> g (1 lb = 454 g), oz -> g (1 oz = 28 g), cups of liquid -> dl (1 cup = 2.4 dl), fl oz -> ml (1 fl oz = 30 ml). Keep tsp and tbsp as they are. Cups of solids like flour or sugar may stay as "cup" when a weight is not given.
- Water is still an ingredient but put it in section "other".
- Salt, pepper and dried herbs go in "spices". Oil, vinegar, flour, sugar, pasta, rice go in "pantry".
- If an ingredient has no quantity (to taste, for serving), use null for quantity and unit.
- Never invent ingredients that are not in the text.
- Keep the ingredient order from the text.`;

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json in response");
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Recipe parsing is not set up. Add ANTHROPIC_API_KEY to the server environment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send JSON with a text field." }, { status: 400 });
  }
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "invalid input" },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: parsedBody.data.text }],
    });
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    const json = extractJson(text);
    const result = parsedRecipeSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "The parser returned something unexpected. Try again or enter it by hand." },
        { status: 502 },
      );
    }
    return NextResponse.json(result.data);
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Parsing failed: ${detail}` }, { status: 502 });
  }
}
