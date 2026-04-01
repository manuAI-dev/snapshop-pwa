// SnapShop Fridge/Ingredient Scanner API Route
// Nutzt Claude Vision (Anthropic API) für Kühlschrank-Scan und Rezept-Generierung
// Key liegt serverseitig – nie im Frontend!

import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// System-Prompt für Ingredient-Erkennung aus Bildern
const INGREDIENT_SCAN_PROMPT = `Du bist ein Experte für Lebensmittel-Erkennung. Deine Aufgabe ist es, Bilder von Kühlschrank-Inhalten oder Lebensmitteln auf einer Arbeitsfläche zu analysieren und alle sichtbaren Zutaten zu identifizieren.

WICHTIG:
- Erkenne ALLE sichtbaren Lebensmittel, Zutaten und Getränke
- Sei thorough und identifiziere auch kleinere Zutaten, Gewürze, Saucen etc.
- Schätze die Menge basierend auf dem sichtbaren Volumen/Anzahl
- Bewerte das Vertrauen (high/medium/low) basierend auf der Sichtbarkeit und Klarheit
- Ignoriere Verpackungen ohne sichtbare Inhalte
- Falls mehrere Bilder: kombiniere alle identifizierten Zutaten aus allen Bildern

Antworte AUSSCHLIESSLICH mit validem JSON in exakt dieser Struktur:
{
  "ingredients": [
    {"name": "Zutat (Deutsch)", "quantity": "Geschätzte Menge", "unit": "Einheit (z.B. Stück, ml, g, Packung)", "confidence": "high|medium|low"},
    {"name": "Zweite Zutat", "quantity": "Menge", "unit": "Einheit", "confidence": "high"}
  ]
}

BEISPIELE:
- 6 Eier sichtbar → {"name": "Eier", "quantity": "6", "unit": "Stück", "confidence": "high"}
- Milchpackung halb voll → {"name": "Milch", "quantity": "500", "unit": "ml", "confidence": "medium"}
- Parmesan-Block → {"name": "Parmesan", "quantity": "1", "unit": "Stück", "confidence": "high"}
- Butter in Schächtelchen → {"name": "Butter", "quantity": "250", "unit": "g", "confidence": "medium"}`;

// System-Prompt für Rezept-Generierung aus bestätigten Zutaten
const RECIPE_GENERATION_FROM_FRIDGE_PROMPT = `Du bist ein Schweizer Kochexperte, spezialisiert auf kreative und praktische Rezepte mit verfügbaren Zutaten.

AUFGABE:
Du erhältst eine Liste von bestätigten Zutaten, die der Benutzer im Kühlschrank/auf dem Tresen hat. Generiere EXAKT 3 verschiedene Rezept-Vorschläge, die hauptsächlich diese Zutaten verwenden.

WICHTIG:
- Nutze ÜBERWIEGEND die verfügbaren Zutaten (mindestens 70-80% sollten verfügbar sein)
- Du darfst 1-2 häufige Grundzutaten vorschlagen, die der Benutzer wahrscheinlich hat (Salz, Pfeffer, Öl, Wasser, Essig, Soy-Sauce, etc.) - aber nicht zu viele!
- Schweizer/deutschsprachige Rezepte bevorzugt
- Schnelle und praktische Gerichte für den Alltag
- Alle Texte in Deutsch (Schweizerdeutsch-kontextualisiert)
- Berücksichtige optionale Präferenzen des Benutzers (z.B. "schnell", "vegetarisch", "italienisch")
- Jedes Rezept sollte 2-4 Schwierigkeitsstufen und realistische Zeiten haben

Antworte AUSSCHLIESSLICH mit validem JSON in exakt dieser Struktur:
{
  "recipes": [
    {
      "dishName": "Name des Gerichts",
      "description": "Kurze Beschreibung des Gerichts",
      "servings": 2,
      "prepTime": 5,
      "cookTime": 15,
      "difficulty": "easy|medium|hard",
      "ingredients": [
        {"name": "Zutat", "quantity": "Menge", "unit": "Einheit", "category": "dairy|protein|grains|vegetables|fruits|spices|condiments|oils|beverages|other"}
      ],
      "instructions": ["Schritt 1", "Schritt 2", "Schritt 3"],
      "cuisine": "Schweizer|Deutsch|Italienisch|etc",
      "tags": ["schnell", "vegetarisch", "einfach"]
    },
    {
      "dishName": "Zweites Rezept",
      "description": "...",
      "servings": 4,
      "prepTime": 10,
      "cookTime": 20,
      "difficulty": "medium",
      "ingredients": [],
      "instructions": [],
      "cuisine": "...",
      "tags": []
    },
    {
      "dishName": "Drittes Rezept",
      "description": "...",
      "servings": 2,
      "prepTime": 15,
      "cookTime": 25,
      "difficulty": "easy",
      "ingredients": [],
      "instructions": [],
      "cuisine": "...",
      "tags": []
    }
  ]
}

WICHTIG:
- EXAKT 3 Rezepte (nicht mehr, nicht weniger)
- Jedes Rezept muss in sich vollständig und essbar sein
- Vielfalt: unterschiedliche Küchen, unterschiedliche Schwierigkeitsgrade
- Alle Zutaten auf Deutsch
- Klare, kurze Anweisungen`;

// Allow longer timeout for AI processing (60s)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Anthropic API Key nicht konfiguriert. Bitte ANTHROPIC_API_KEY in .env.local setzen.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { mode, images, ingredients, preferences } = body;

    if (!mode || !["scan", "generate"].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode muss "scan" oder "generate" sein' },
        { status: 400 }
      );
    }

    // === MODE: SCAN ===
    // Bilder analysieren und Zutaten identifizieren
    if (mode === "scan") {
      if (!images || images.length === 0) {
        return NextResponse.json(
          { error: "Keine Bilder bereitgestellt" },
          { status: 400 }
        );
      }

      // Alle Base64-Bilder in Claude Vision Format konvertieren
      const imageBlocks: any[] = [];
      for (const base64Image of images) {
        // Prüfe ob das Bild bereits ein Data-URI hat oder nur Base64
        let imageData = base64Image;
        let mediaType = "image/jpeg"; // default

        if (base64Image.startsWith("data:")) {
          // Data-URI Format: "data:image/png;base64,..."
          const match = base64Image.match(/^data:image\/([a-z]+);base64,(.+)$/);
          if (match) {
            mediaType = `image/${match[1]}`;
            imageData = match[2];
          }
        }

        imageBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: imageData,
          },
        });
      }

      const userContent = [
        ...imageBlocks,
        {
          type: "text",
          text:
            images.length > 1
              ? `Diese ${images.length} Bilder zeigen den Kühlschrank und/oder Zutaten auf der Arbeitsfläche. Analysiere ALLE Bilder und identifiziere ALLE sichtbaren Lebensmittel und Zutaten.`
              : "Analysiere dieses Bild des Kühlschranks/der Zutaten und identifiziere alle sichtbaren Lebensmittel.",
        },
      ];

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
          temperature: 0.3,
          system: INGREDIENT_SCAN_PROMPT,
          messages: [
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Anthropic API Error:", JSON.stringify(errorData));
        const errMsg = errorData?.error?.message || "KI-Verarbeitung fehlgeschlagen";
        const errType = errorData?.error?.type || "unknown";

        if (response.status === 429 || errType === "rate_limit_error") {
          return NextResponse.json(
            {
              error: `Rate Limit erreicht. Bitte warte einen Moment und versuche es erneut.`,
            },
            { status: 429 }
          );
        }
        if (errType === "authentication_error" || response.status === 401) {
          return NextResponse.json(
            { error: `API-Key ungültig oder abgelaufen.` },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: `API Fehler: ${errMsg}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const textContent = data.content.find(
        (block: any) => block.type === "text"
      );

      if (!textContent) {
        return NextResponse.json(
          { error: "Keine Antwort von der KI erhalten" },
          { status: 500 }
        );
      }

      // JSON aus der Antwort extrahieren
      let jsonString = textContent.text.trim();
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }

      const scanResult = JSON.parse(jsonString);

      // Normalisieren
      const normalizedIngredients = (scanResult.ingredients || []).map(
        (ing: any) => ({
          name: ing.name || "",
          quantity: String(ing.quantity || ""),
          unit: ing.unit || "",
          confidence: ing.confidence || "medium",
        })
      );

      return NextResponse.json({
        ingredients: normalizedIngredients,
      });
    }

    // === MODE: GENERATE ===
    // Rezepte basierend auf bestätigten Zutaten generieren
    if (mode === "generate") {
      if (!ingredients || ingredients.length === 0) {
        return NextResponse.json(
          { error: "Keine Zutaten bereitgestellt" },
          { status: 400 }
        );
      }

      // Zutaten-Liste zusammenstellen
      const ingredientsList = ingredients
        .map((ing: string) => `- ${ing}`)
        .join("\n");

      let userPrompt = `Verfügbare Zutaten:\n${ingredientsList}`;

      if (preferences) {
        userPrompt += `\n\nBenutzer-Präferenzen: ${preferences}`;
      }

      userPrompt += `\n\nGeneriere EXAKT 3 verschiedene Rezept-Vorschläge, die hauptsächlich diese verfügbaren Zutaten verwenden.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 3000,
          temperature: 0.7,
          system: RECIPE_GENERATION_FROM_FRIDGE_PROMPT,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Anthropic API Error:", JSON.stringify(errorData));
        const errMsg = errorData?.error?.message || "Rezept-Generierung fehlgeschlagen";
        const errType = errorData?.error?.type || "unknown";

        if (response.status === 429 || errType === "rate_limit_error") {
          return NextResponse.json(
            {
              error: `Rate Limit erreicht. Bitte warte einen Moment und versuche es erneut.`,
            },
            { status: 429 }
          );
        }
        if (errType === "authentication_error" || response.status === 401) {
          return NextResponse.json(
            { error: `API-Key ungültig oder abgelaufen.` },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: `API Fehler: ${errMsg}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const textContent = data.content.find(
        (block: any) => block.type === "text"
      );

      if (!textContent) {
        return NextResponse.json(
          { error: "Keine Antwort von der KI erhalten" },
          { status: 500 }
        );
      }

      // JSON aus der Antwort extrahieren
      let jsonString = textContent.text.trim();
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }

      const recipeData = JSON.parse(jsonString);

      // Normalisieren: sicherstellen dass genau 3 Rezepte vorhanden sind
      const recipes = (recipeData.recipes || [])
        .slice(0, 3)
        .map((recipe: any) => ({
          dishName: recipe.dishName || "Unbekanntes Rezept",
          description: recipe.description || "",
          servings: recipe.servings || 2,
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          difficulty: (recipe.difficulty || "medium").toLowerCase(),
          ingredients: (recipe.ingredients || []).map((ing: any) => ({
            name: ing.name || "",
            quantity: String(ing.quantity || ""),
            unit: ing.unit || "",
            category: ing.category || "other",
          })),
          instructions: recipe.instructions || [],
          cuisine: recipe.cuisine || "International",
          tags: recipe.tags || [],
        }));

      return NextResponse.json({
        recipes,
      });
    }
  } catch (error: any) {
    console.error("Fridge scanner error:", error);
    return NextResponse.json(
      { error: error.message || "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
