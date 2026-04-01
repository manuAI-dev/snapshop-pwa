// SnapShop Ingredient Alternatives API
// Suggests replacement ingredients for hard-to-find items

import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `Du bist ein erfahrener Koch und Lebensmittelexperte. Deine Aufgabe: Für eine gegebene Zutat schlägst du 2-3 leicht erhältliche Alternativen vor, die in einem Rezept als Ersatz funktionieren.

Regeln:
- Alternativen müssen in einem normalen Schweizer Supermarkt (Coop, Migros) erhältlich sein
- Erkläre kurz, wie sich der Geschmack/Textur ändert
- Gib an, welches Mengenverhältnis gilt (z.B. "gleiche Menge" oder "die Hälfte davon")
- Sei ehrlich wenn eine Zutat nicht gut ersetzbar ist
- Antwort auf Deutsch

Antworte AUSSCHLIESSLICH mit validem JSON:
{
  "originalIngredient": "Name der Originalzutat",
  "isExotic": true/false,
  "alternatives": [
    {
      "name": "Name der Alternative",
      "ratio": "gleiche Menge",
      "note": "Kurze Erklärung warum das funktioniert"
    }
  ],
  "tip": "Optionaler allgemeiner Tipp zur Zutat (z.B. wo man sie finden kann)"
}

Wenn die Zutat ganz normal und überall erhältlich ist (z.B. Eier, Butter, Zwiebeln), setze "isExotic" auf false und gib trotzdem hilfreiche Alternativen.`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { ingredient, recipeName, recipeContext } = await req.json();

    if (!ingredient) {
      return NextResponse.json({ error: "Missing ingredient" }, { status: 400 });
    }

    const userMessage = recipeContext
      ? `Zutat: "${ingredient}"\nRezept: "${recipeName || "Unbekannt"}"\nKontext (andere Zutaten): ${recipeContext}\n\nSchlage Alternativen vor.`
      : `Zutat: "${ingredient}"\n${recipeName ? `Rezept: "${recipeName}"` : ""}\n\nSchlage Alternativen vor.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Alternatives API error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
