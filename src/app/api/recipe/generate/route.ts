// SnapShop Recipe Generation API Route
// Nutzt Claude Vision (Anthropic API) statt OpenAI
// Key liegt serverseitig – nie im Frontend!

import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// System-Prompt für Rezepterkennung aus Bildern
const RECIPE_FROM_IMAGE_PROMPT = `Du bist ein Experte für Rezepte und Kochen. Deine Aufgabe ist es, ein Bild zu analysieren und ein strukturiertes Rezept im JSON-Format zu generieren.

OBERSTE PRIORITÄT: EXAKTE TEXTWIEDERGABE
Wenn das Bild eine Rezeptseite aus einem Kochbuch zeigt:
- Übernimm ALLEN Text WÖRTLICH und 1:1 so wie er im Buch steht. Kürze NICHT, fasse NICHT zusammen, formuliere NICHT um.
- Einleitungstext / Beschreibung: Wenn vor der Zutatenliste oder Anleitung ein einleitender Text steht (z.B. eine persönliche Anmerkung, Hintergrundinfo, Serviervorschlag), übernimm diesen EXAKT in das "description" Feld.
- Zubereitungsschritte: WÖRTLICH 1:1 übernehmen. Wenn ein Absatz im Buch lang ist, übernimm ihn trotzdem komplett als einen Schritt.
- Extrahiere Zutaten mit exakten Mengen und Bezeichnungen wie im Original.
- Behalte die Originalsprache des Rezepts bei.
- Ergänze fehlende Infos (Zeiten, Schwierigkeit) nur wenn sie nicht im Bild stehen.

Wenn das Bild ein fertiges Gericht zeigt (kein Rezepttext sichtbar):
- Identifiziere das Gericht und generiere ein plausibles Rezept.

Antworte AUSSCHLIESSLICH mit validem JSON in exakt dieser Struktur:
{
  "dishName": "Name des Gerichts",
  "cuisine": "Küche (z.B. Italienisch, Deutsch, Asiatisch)",
  "description": "Einleitungstext / Beschreibung des Rezepts, exakt wie im Original falls vorhanden",
  "ingredients": [
    {"name": "Zutat", "quantity": "Menge", "unit": "Einheit", "category": "dairy|protein|grains|vegetables|fruits|spices|condiments|oils|beverages|other", "group": "Untergruppenname falls vorhanden (z.B. Teig, Sauce, Garnierung)", "notes": "optional"}
  ],
  "instructions": ["Exakter Originaltext Schritt 1", "Exakter Originaltext Schritt 2", "..."],
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "difficulty": "easy|medium|hard",
  "nutrition": {
    "calories": 450,
    "protein": 18,
    "fat": 22,
    "carbs": 45,
    "fiber": 6,
    "sugar": 8
  }
}

WICHTIG:
- ALLES ist exakter Originaltext aus dem Bild: Beschreibung, Zutaten, Zubereitungsschritte. NICHTS umformulieren, NICHTS kürzen, NICHTS weglassen.
- Jeder Absatz im Original = ein Eintrag im instructions Array. Auch Einleitungstexte vor der Anleitung gehören ins description Feld.
- Schätze die Nährwerte PRO PORTION basierend auf den Zutaten und Mengen. Realistisch, nicht perfekt.`;

// System-Prompt für Restaurant-Gericht → Rezept zum Nachkochen
const RECIPE_FROM_RESTAURANT_PROMPT = `Du bist ein Spitzenkoch und Rezept-Experte. Du siehst ein Foto von einem Gericht, das in einem Restaurant serviert wurde. Deine Aufgabe:

1. Identifiziere das Gericht so genau wie möglich (Name, Küche, Hauptzutaten).
2. Erstelle ein detailliertes Rezept zum NACHKOCHEN zuhause.
3. Beschreibe in der "description" auch die Präsentation und was das Gericht besonders macht.
4. Gib realisische Zutaten an, die in einem Schweizer Supermarkt (Coop, Migros) erhältlich sind.
5. Füge Tipps zur Anrichtung/Präsentation als letzten instruction-Schritt hinzu ("Anrichten: ...").

Antworte AUSSCHLIESSLICH mit validem JSON in exakt dieser Struktur:
{
  "dishName": "Name des Gerichts",
  "cuisine": "Küche (z.B. Italienisch, Japanisch, Französisch)",
  "description": "Beschreibung des Gerichts, was es besonders macht, Präsentationstipps",
  "ingredients": [
    {"name": "Zutat", "quantity": "Menge", "unit": "Einheit", "category": "dairy|protein|grains|vegetables|fruits|spices|condiments|oils|beverages|other", "group": "Untergruppenname falls sinnvoll", "notes": "optional"}
  ],
  "instructions": ["Schritt 1", "Schritt 2", "...", "Anrichten: Beschreibung der Präsentation wie im Restaurant"],
  "servings": 2,
  "prepTime": 15,
  "cookTime": 30,
  "difficulty": "easy|medium|hard",
  "nutrition": {
    "calories": 450,
    "protein": 18,
    "fat": 22,
    "carbs": 45,
    "fiber": 6,
    "sugar": 8
  }
}

WICHTIG:
- Mache das Rezept so authentisch wie möglich basierend auf dem, was du im Bild siehst.
- Wenn du das Gericht nicht genau identifizieren kannst, beschreibe es und erstelle ein plausibles Rezept.
- Der letzte instruction-Schritt sollte IMMER Anrichte-Tipps enthalten.
- Nährwerte PRO PORTION schätzen.`;

// System-Prompt für Rezept-Extraktion aus Webseiten
const RECIPE_FROM_URL_PROMPT = `Du bist ein Experte für Rezepte. Du erhältst den Inhalt einer Rezeptseite — entweder als JSON-LD Structured Data (schema.org Recipe), als HTML-Text, oder beides. Extrahiere das Rezept und formatiere es als strukturiertes JSON.

OBERSTE PRIORITÄT: EXAKTE TEXTWIEDERGABE
- Übernimm ALLE Texte WÖRTLICH und 1:1 so wie sie auf der Webseite stehen.
- Mengenangaben EXAKT übernehmen: Wenn "2 dl" steht, dann "2 dl" — NICHT in ml umrechnen. Wenn "1 ½ Liter" steht, dann "1 ½" als quantity und "Liter" als unit.
- Zutatennamen EXAKT übernehmen: Wenn "Bratspeck in Tranchen" steht, dann "Bratspeck in Tranchen" — NICHT "Speck, 8 Scheiben".
- Einleitungstext / Beschreibung: Wenn vorhanden, EXAKT in "description" übernehmen.
- Zubereitungsschritte: WÖRTLICH 1:1 übernehmen. NICHT kürzen, NICHT umformulieren.
- Wenn die Zutaten in Untergruppen organisiert sind (z.B. "Teig", "Sauce", "Garnierung"), diese als "group" Feld übernehmen.
- Bei JSON-LD HowToStep: Das "name" Feld jedes Steps ist die UNTERGRUPPE (group). Weise die Zutaten der passenden Gruppe zu.
- Ignoriere Werbung, Kommentare, Navigation und irrelevante Inhalte.

WENN JSON-LD STRUCTURED DATA VORHANDEN:
- Bevorzuge die Daten aus dem JSON-LD (schema.org Recipe) — sie sind am zuverlässigsten.
- recipeIngredient Array → ingredients (parse Menge, Einheit, Name)
- recipeInstructions → instructions (nimm den "text" Wert jedes HowToStep)
- Das "name" Feld jedes HowToStep = Untergruppe für die zugehörigen Zutaten
- nutrition → übernimm die exakten Werte (nur Zahl ohne Einheit)
- recipeYield → servings
- prepTime/cookTime im ISO 8601 Format (PT30M = 30 Minuten)

Antworte AUSSCHLIESSLICH mit validem JSON:
{
  "dishName": "Exakter Name",
  "cuisine": "Küche",
  "description": "Einleitungstext exakt wie auf der Seite, falls vorhanden",
  "ingredients": [
    {"name": "Exakter Name", "quantity": "Exakte Menge", "unit": "Exakte Einheit", "category": "dairy|protein|grains|vegetables|fruits|spices|condiments|oils|beverages|other", "group": "Untergruppenname falls vorhanden", "notes": "Zusatzinfos falls vorhanden"}
  ],
  "instructions": ["Exakter Originaltext Schritt 1", "Exakter Originaltext Schritt 2"],
  "servings": 4, "prepTime": 0, "cookTime": 0, "difficulty": "easy|medium|hard",
  "nutrition": {"calories": 0, "protein": 0, "fat": 0, "carbs": 0, "fiber": 0, "sugar": 0}
}

WICHTIG:
- NICHTS umrechnen, NICHTS umformulieren, NICHTS weglassen. Exakte Wiedergabe des Originaltextes.
- Nährwerte PRO PORTION: Wenn im JSON-LD vorhanden, exakte Werte übernehmen. Sonst schätzen.`;

// Edge Runtime: 50s Timeout auf Netlify (statt 10s bei Node Functions)
export const runtime = "edge";

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
    const contentType = request.headers.get("content-type") || "";

    let systemPrompt: string;
    let userContent: any[];

    if (contentType.includes("multipart/form-data")) {
      // === Bild-Upload: Foto(s) → Rezept ===
      const formData = await request.formData();
      const imageFiles = formData.getAll("image") as File[];
      const mode = (formData.get("mode") as string) || "recipe"; // "recipe" oder "restaurant"

      if (!imageFiles || imageFiles.length === 0) {
        return NextResponse.json(
          { error: "Kein Bild hochgeladen" },
          { status: 400 }
        );
      }

      // Alle Bilder zu Base64 konvertieren (Edge-kompatibel, kein Buffer)
      const toBase64 = (buf: ArrayBuffer): string => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        const chunkSize = 0x8000; // 32KB Chunks für Performance
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        return btoa(binary);
      };

      const imageBlocks: any[] = [];
      for (const imageFile of imageFiles) {
        const base64 = toBase64(await imageFile.arrayBuffer());
        const mediaType = imageFile.type || "image/jpeg";
        imageBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64,
          },
        });
      }

      if (mode === "restaurant") {
        systemPrompt = RECIPE_FROM_RESTAURANT_PROMPT;
        userContent = [
          ...imageBlocks,
          {
            type: "text",
            text: "Dieses Foto zeigt ein Gericht aus einem Restaurant. Identifiziere das Gericht und erstelle ein detailliertes Rezept zum Nachkochen zuhause. Antworte im JSON-Format.",
          },
        ];
      } else {
        systemPrompt = RECIPE_FROM_IMAGE_PROMPT;
        const isMultiPage = imageFiles.length > 1;
        userContent = [
          ...imageBlocks,
          {
            type: "text",
            text: isMultiPage
              ? `Diese ${imageFiles.length} Bilder zeigen verschiedene Seiten/Teile DESSELBEN Rezepts (z.B. aus einem Kochbuch). Kombiniere ALLE sichtbaren Informationen von ALLEN Seiten zu einem einzigen vollständigen Rezept. Generiere ein strukturiertes Rezept im JSON-Format.`
              : "Analysiere dieses Bild und generiere ein strukturiertes Rezept im JSON-Format.",
          },
        ];
      }
    } else {
      // === URL oder vorextrahierter Text → Rezept ===
      const body = await request.json();
      const { url, pageText } = body;

      if (!url && !pageText) {
        return NextResponse.json(
          { error: "Keine URL oder Seitentext angegeben" },
          { status: 400 }
        );
      }

      let contentForAI: string;

      if (pageText) {
        // Client hat den Seitentext bereits extrahiert (funktioniert für SPAs)
        contentForAI = pageText.substring(0, 40000);
      } else {
        // Fallback: Server-side Fetch (funktioniert für statische Seiten)
        const pageResponse = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
          },
        });
        const html = await pageResponse.text();

        // Try to find JSON-LD structured data first (many recipe sites use this)
        const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        let jsonLdData = "";
        if (jsonLdMatch) {
          jsonLdData = jsonLdMatch.map(m =>
            m.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim()
          ).join("\n");
        }

        // Strip HTML tags to get clean text
        const cleanText = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (jsonLdData.length > 100) {
          contentForAI = `JSON-LD Structured Data:\n${jsonLdData.substring(0, 20000)}\n\nPage Text:\n${cleanText.substring(0, 20000)}`;
        } else {
          contentForAI = cleanText.substring(0, 40000);
        }
      }

      systemPrompt = RECIPE_FROM_URL_PROMPT;
      userContent = [
        {
          type: "text",
          text: `Extrahiere das Rezept aus folgendem Seiteninhalt:\n\n${contentForAI}`,
        },
      ];
    }

    // Streaming-Response: sofort Bytes zum Client senden, kein Timeout
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Keepalive: alle 3s ein Newline senden, damit Netlify nicht abbricht
        const keepalive = setInterval(() => {
          try { controller.enqueue(encoder.encode("\n")); } catch { /* stream closed */ }
        }, 3000);

        try {
          // Anthropic API Call mit Streaming
          const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": ANTHROPIC_API_KEY!,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: CLAUDE_MODEL,
              max_tokens: 4000,
              temperature: 0.3,
              stream: true,
              system: systemPrompt,
              messages: [{ role: "user", content: userContent }],
            }),
          });

          if (!aiResponse.ok) {
            let errMsg = "KI-Verarbeitung fehlgeschlagen";
            try {
              const errorData = await aiResponse.json();
              errMsg = errorData?.error?.message || errMsg;
            } catch { /* ignore */ }
            clearInterval(keepalive);
            controller.enqueue(encoder.encode(JSON.stringify({ error: `API Fehler: ${errMsg} (Status ${aiResponse.status})` })));
            controller.close();
            return;
          }

          // Stream lesen, Text sammeln
          const reader = aiResponse.body?.getReader();
          if (!reader) {
            clearInterval(keepalive);
            controller.enqueue(encoder.encode(JSON.stringify({ error: "Kein Stream" })));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let fullText = "";
          let sseBuffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const event = JSON.parse(jsonStr);
                if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                  fullText += event.delta.text;
                }
              } catch { /* skip */ }
            }
          }

          clearInterval(keepalive);

          if (!fullText) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "Keine Antwort von der KI erhalten" })));
            controller.close();
            return;
          }

          // JSON parsen
          let jsonString = fullText.trim();
          const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) jsonString = jsonMatch[1].trim();

          const recipeJson = JSON.parse(jsonString);

          // Normalisieren
          const rawNutrition = recipeJson.nutrition;
          const nutrition = rawNutrition
            ? {
                calories: Math.round(Number(rawNutrition.calories) || 0),
                protein: Math.round(Number(rawNutrition.protein) || 0),
                fat: Math.round(Number(rawNutrition.fat) || 0),
                carbs: Math.round(Number(rawNutrition.carbs) || 0),
                fiber: Math.round(Number(rawNutrition.fiber) || 0),
                sugar: Math.round(Number(rawNutrition.sugar) || 0),
              }
            : undefined;

          const recipe = {
            dishName: recipeJson.dishName || recipeJson.dish_name || "Unbekanntes Rezept",
            cuisine: recipeJson.cuisine || "International",
            description: recipeJson.description || "",
            ingredients: (recipeJson.ingredients || []).map((ing: any) => ({
              name: ing.name || "",
              quantity: String(ing.quantity || ""),
              unit: ing.unit || "",
              category: ing.category || "other",
              group: ing.group || "",
              notes: ing.notes || "",
              isSelected: false,
            })),
            instructions: recipeJson.instructions || [],
            servings: recipeJson.servings || 4,
            prepTime: recipeJson.prepTime || recipeJson.prep_time || 0,
            cookTime: recipeJson.cookTime || recipeJson.cook_time || 0,
            difficulty: (recipeJson.difficulty || "medium").toLowerCase(),
            nutrition,
            recipeImages: [],
          };

          controller.enqueue(encoder.encode(JSON.stringify(recipe)));
          controller.close();
        } catch (err: any) {
          clearInterval(keepalive);
          console.error("Recipe generation stream error:", err);
          controller.enqueue(encoder.encode(JSON.stringify({ error: err.message || "Unbekannter Fehler" })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("Recipe generation error:", error);
    return NextResponse.json(
      { error: error.message || "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
