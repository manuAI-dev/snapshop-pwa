// SnapShop AI Wochenplaner API Route
// Generiert einen 7-Tage Meal Plan basierend auf Haushaltsprofil + Stimmungs-Präferenzen
// Quellen: Gespeicherte Rezepte (bevorzugt) + Feed-Inspirationen (Fooby, Betty Bossi, Migusto, Swissmilk)

import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// ============================================================
// System-Prompt — dynamisch erweitert mit Präferenzen
// ============================================================

function buildSystemPrompt(numDays: number, preferences?: any): string {
  let base = `Du bist ein Schweizer Ernährungsberater und Meal-Planner. Schlage ${numDays} Abendessen vor (1 pro Tag).

REGELN:
1. ALLE Ernährungsweisen und Allergien STRIKT respektieren.
2. Kochzeit beachten (Wochentags vs. Wochenende).
3. Abwechslung: Nie gleiche Küche/Hauptzutat 2 Tage hintereinander.
4. BEVORZUGE "GESPEICHERTE REZEPTE" (nutze deren recipeId).
5. NUTZE "INSPIRATIONEN" als Vorschläge (recipeId = null). Verwende möglichst den EXAKTEN Titel.
6. Saisonale Schweizer Zutaten (Coop/Migros verfügbar).`;

  // === Dynamische Regeln basierend auf Präferenzen ===
  if (preferences) {
    const rules: string[] = [];

    // Gesundheit: 0=Soulfood, 100=Super gesund
    if (preferences.healthiness <= 25) {
      rules.push("STIL: Comfort Food / Soulfood — deftige, wärmende Gerichte, Klassiker, Käse, Rahm, Teigwaren erlaubt.");
    } else if (preferences.healthiness <= 50) {
      rules.push("STIL: Ausgewogen — gute Mischung aus gesunden und genussvollen Gerichten.");
    } else if (preferences.healthiness <= 75) {
      rules.push("STIL: Gesund — viel Gemüse, Vollkorn, mageres Protein, wenig Fett.");
    } else {
      rules.push("STIL: Super gesund — maximale Nährstoffdichte, Superfoods, kalorienarm, viel Gemüse und Hülsenfrüchte.");
    }

    // Aufwand: 0=Schnell, 100=Aufwändig
    if (preferences.effort <= 25) {
      rules.push("AUFWAND: Blitzschnell — alle Gerichte unter 20 Minuten, One-Pot/Pan, minimal Zutaten.");
    } else if (preferences.effort <= 50) {
      rules.push("AUFWAND: Einfach — unkomplizierte Rezepte, max 30 Minuten.");
    } else if (preferences.effort <= 75) {
      rules.push("AUFWAND: Mittel — unter der Woche einfach, Wochenende darf aufwändiger sein.");
    } else {
      rules.push("AUFWAND: Kreativ & aufwändig — ambitionierte Rezepte mit besonderen Techniken, Wochenende = Highlight.");
    }

    // Abwechslung: 0=Klassiker, 100=Experimentell
    if (preferences.variety <= 25) {
      rules.push("VIELFALT: Klassiker — bewährte Schweizer und europäische Rezepte, keine exotischen Zutaten.");
    } else if (preferences.variety <= 50) {
      rules.push("VIELFALT: Bekanntes — vorwiegend vertraute Gerichte, gelegentlich etwas Neues.");
    } else if (preferences.variety <= 75) {
      rules.push("VIELFALT: Abwechslungsreich — verschiedene Küchen (Schweizer, Mediterran, Asiatisch, Mexikanisch).");
    } else {
      rules.push("VIELFALT: Experimentell — ungewöhnliche Kombinationen, exotische Zutaten, Fusion-Küche, überraschende Gerichte.");
    }

    // Boolean toggles
    if (preferences.seasonal) rules.push("SAISONAL: Verwende bevorzugt saisonale Zutaten der aktuellen Jahreszeit (Schweiz).");
    if (preferences.budgetFriendly) rules.push("BUDGET: Budgetbewusst — günstige Zutaten, keine teuren Spezialitäten, Hülsenfrüchte und saisonales Gemüse bevorzugen.");
    if (preferences.kidFriendly) rules.push("KINDER: Kindgerecht — keine zu scharfen/bitteren Gerichte, Texturen die Kinder mögen, spielerische Präsentation möglich.");
    if (preferences.mealPrepFriendly) rules.push("MEAL PREP: Gut vorzubereiten — Gerichte die sich portionieren und aufwärmen lassen, ideal für 2+ Tage.");

    if (rules.length > 0) {
      base += "\n\nSTIMMUNG DIESE WOCHE:\n" + rules.map(r => `- ${r}`).join("\n");
    }
  }

  base += `

Antworte NUR mit validem JSON — kein Text davor oder danach:
[
  {"date":"YYYY-MM-DD","recipeName":"Name","recipeId":"id oder null","description":"1 Satz","cookTime":30,"servings":4},
  ...
]

${numDays} Objekte, 1 pro Tag. Kein Wrapper-Objekt, nur das Array.`;

  return base;
}

// Allow longer timeout for AI processing
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Anthropic API Key nicht konfiguriert." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      startDate,
      numDays: rawNumDays,
      profile,
      existingRecipes,
      feedRecipes,
      preferences,
    } = body;

    const numDays = Math.min(Math.max(rawNumDays || 7, 1), 14);

    if (!startDate || !profile) {
      return NextResponse.json(
        { error: "startDate und profile sind erforderlich" },
        { status: 400 }
      );
    }

    // === Gespeicherte Rezepte ===
    let savedContext = "";
    if (existingRecipes && existingRecipes.length > 0) {
      const list = existingRecipes
        .slice(0, 40)
        .map((r: any) => `  - "${r.dishName}" (${r.cookTime || "?"}min) [id:${r.id}]`)
        .join("\n");
      savedContext = `\nGESPEICHERTE REZEPTE (bevorzugt nutzen, recipeId = id-Wert):\n${list}`;
    }

    // === Feed-Inspirationen ===
    let feedContext = "";
    if (feedRecipes && feedRecipes.length > 0) {
      const list = feedRecipes
        .slice(0, 60)
        .map((r: any) => `  - "${r.title}" (${r.source})`)
        .join("\n");
      feedContext = `\nINSPIRATIONEN (als Vorschläge nutzen, recipeId = null, exakte Titel verwenden):\n${list}`;
    }

    // === Datums-Berechnung ===
    const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    const start = new Date(startDate);
    const dates: string[] = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${day} (${dayNames[d.getDay()]})`);
    }

    // === Profil-Texte ===
    const totalPersons = (profile.adults || 2) + (profile.children || 0);
    const dietaryStr = profile.dietary?.length > 0
      ? profile.dietary.join(", ")
      : "Keine Einschränkungen";
    const allergyStr = profile.allergies?.length > 0
      ? profile.allergies.join(", ")
      : "Keine";

    // === Monat für Saisonalität ===
    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const currentMonth = monthNames[start.getMonth()];

    const userMessage = `Daten: ${dates.join(", ")}
Monat: ${currentMonth} (für saisonale Zutaten)
${totalPersons} Personen (${profile.adults || 2} Erw. + ${profile.children || 0} Kinder) · Ernährung: ${dietaryStr} · Allergien: ${allergyStr}
Kochzeit Mo-Fr: max ${profile.cookingTimeWeekday || 30}min · Sa-So: max ${profile.cookingTimeWeekend || 60}min
${savedContext}${feedContext}

${numDays} Abendessen als JSON-Array.`;

    const systemPrompt = buildSystemPrompt(numDays, preferences);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Anthropic API Error:", JSON.stringify(errorData));
      const errMsg = errorData?.error?.message || "KI-Verarbeitung fehlgeschlagen";
      if (response.status === 429) {
        return NextResponse.json(
          { error: `Rate Limit erreicht. Bitte warte einen Moment. (${errMsg})` },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `API Fehler: ${errMsg}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const textContent = data.content.find((block: any) => block.type === "text");
    if (!textContent) {
      return NextResponse.json(
        { error: "Keine Antwort von der KI erhalten" },
        { status: 500 }
      );
    }

    // Parse JSON — handle markdown code blocks
    let jsonString = textContent.text.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim();
    }

    // Robustes Parsing
    const firstBracket = jsonString.indexOf("[");
    const lastBracket = jsonString.lastIndexOf("]");
    const firstBrace = jsonString.indexOf("{");
    const lastBrace = jsonString.lastIndexOf("}");

    let meals: any[];

    if (firstBracket !== -1 && lastBracket > firstBracket &&
        (firstBrace === -1 || firstBracket < firstBrace)) {
      meals = JSON.parse(jsonString.substring(firstBracket, lastBracket + 1));
    } else if (firstBrace !== -1 && lastBrace > firstBrace) {
      const obj = JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
      meals = obj.weekPlan || obj.meals || obj.plan || Object.values(obj).find(Array.isArray) || [];
    } else {
      return NextResponse.json(
        { error: "Ungültige AI-Antwort: kein JSON gefunden" },
        { status: 500 }
      );
    }

    if (!Array.isArray(meals) || meals.length === 0) {
      return NextResponse.json(
        { error: "Ungültiger Plan: keine Mahlzeiten generiert" },
        { status: 500 }
      );
    }

    const normalized = meals.slice(0, numDays).map((m: any) => ({
      date: m.date || "",
      recipeName: m.recipeName || m.name || "Unbekannt",
      recipeId: m.recipeId || null,
      description: m.description || "",
      cookTime: m.cookTime || 30,
      servings: m.servings || totalPersons,
    }));

    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("Planner generation error:", error);
    return NextResponse.json(
      { error: error.message || "Unbekannter Fehler bei der Wochenplan-Generierung" },
      { status: 500 }
    );
  }
}
