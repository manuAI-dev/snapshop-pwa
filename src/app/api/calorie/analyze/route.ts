// SnapShop AI Kalorien-Analyse: Foto → geschätzte Nährwerte
// Nutzt Claude Vision um ein Gericht zu identifizieren und Nährwerte zu schätzen

import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const ANALYSIS_PROMPT = `Du bist ein Ernährungsexperte. Analysiere dieses Foto eines Gerichts/Lebensmittels.

Schätze die Nährwerte für EINE PORTION:
1. Identifiziere das Gericht (deutsch, kurzer Name)
2. Schätze Kalorien, Protein, Kohlenhydrate und Fett

Antworte NUR mit validem JSON:
{"title":"Gericht-Name","calories":450,"protein":25,"carbs":55,"fat":18}

Keine zusätzlichen Erklärungen. Nur das JSON-Objekt.`;

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API Key nicht konfiguriert" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });
    }

    // Convert to base64
    const buffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Determine media type
    let mediaType = "image/jpeg";
    if (imageFile.type) {
      mediaType = imageFile.type;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        temperature: 0.3,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: ANALYSIS_PROMPT,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic Vision Error:", JSON.stringify(err));
      return NextResponse.json(
        { error: err?.error?.message || "Bildanalyse fehlgeschlagen" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const textContent = data.content.find((b: any) => b.type === "text");
    if (!textContent) {
      return NextResponse.json({ error: "Keine Antwort erhalten" }, { status: 500 });
    }

    // Parse JSON from response
    let jsonString = textContent.text.trim();
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const result = JSON.parse(jsonString);
    return NextResponse.json({
      title: result.title || "Unbekanntes Gericht",
      calories: Math.round(Number(result.calories) || 0),
      protein: Math.round(Number(result.protein) || 0),
      carbs: Math.round(Number(result.carbs) || 0),
      fat: Math.round(Number(result.fat) || 0),
    });
  } catch (error: any) {
    console.error("Calorie analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analyse fehlgeschlagen" },
      { status: 500 }
    );
  }
}
