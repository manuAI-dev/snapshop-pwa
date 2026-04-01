// Extract text content from a recipe URL
// Supports: static HTML pages, JSON-LD structured data, and known SPA sites (fooby.ch)

import { NextRequest, NextResponse } from "next/server";

// Allow longer timeout for fetching external pages
export const maxDuration = 30;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
  "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
};

// ===== Strategy 1: Try known API endpoints for SPA sites =====
async function tryKnownAPIs(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);

    // === fooby.ch ===
    // URL pattern: /de/rezepte/{id}/{slug}
    if (parsed.hostname.includes("fooby.ch")) {
      const match = url.match(/\/rezepte\/(\d+)\//);
      if (match) {
        const recipeId = match[1];
        // fooby.ch uses a GraphQL/REST API — try multiple known patterns
        const apiUrls = [
          `https://fooby.ch/api/recipes/${recipeId}`,
          `https://www.fooby.ch/api/recipes/${recipeId}`,
          `https://fooby.ch/api/v1/recipes/${recipeId}`,
        ];
        for (const apiUrl of apiUrls) {
          try {
            const resp = await fetch(apiUrl, {
              headers: { ...FETCH_HEADERS, Accept: "application/json" },
            });
            if (resp.ok) {
              const data = await resp.text();
              if (data.length > 100) {
                return `[fooby.ch API data]\n${data}`;
              }
            }
          } catch {
            // Try next
          }
        }
      }
    }

    // === betty bossi ===
    if (parsed.hostname.includes("bettybossi.ch")) {
      const match = url.match(/\/rezept\/[^/]*-(\d+)/);
      if (match) {
        try {
          const apiUrl = `https://www.bettybossi.ch/api/recipe/${match[1]}`;
          const resp = await fetch(apiUrl, {
            headers: { ...FETCH_HEADERS, Accept: "application/json" },
          });
          if (resp.ok) {
            const data = await resp.text();
            if (data.length > 100) return `[bettybossi API data]\n${data}`;
          }
        } catch {
          // Fall through
        }
      }
    }
  } catch {
    // URL parsing failed
  }
  return null;
}

// ===== Strategy 2: Extract JSON-LD structured data =====
interface JsonLdResult {
  text: string | null;
  imageUrl: string | null;
}

function extractJsonLd(html: string): JsonLdResult {
  const jsonLdBlocks = html.match(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!jsonLdBlocks || jsonLdBlocks.length === 0) return { text: null, imageUrl: null };

  const recipeJsonLd: string[] = [];
  let imageUrl: string | null = null;

  for (const block of jsonLdBlocks) {
    const content = block
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();
    try {
      const parsed = JSON.parse(content);
      // Check if it's a Recipe or contains a Recipe
      const isRecipe =
        parsed["@type"] === "Recipe" ||
        (Array.isArray(parsed["@graph"]) &&
          parsed["@graph"].some((item: any) => item["@type"] === "Recipe"));
      if (isRecipe) {
        recipeJsonLd.push(content);
        // Extract image URL from Recipe JSON-LD
        const recipeObj = parsed["@type"] === "Recipe"
          ? parsed
          : parsed["@graph"]?.find((item: any) => item["@type"] === "Recipe");
        if (recipeObj) {
          const img = recipeObj.image;
          if (typeof img === "string") {
            imageUrl = img;
          } else if (Array.isArray(img) && img.length > 0) {
            imageUrl = typeof img[0] === "string" ? img[0] : img[0]?.url || null;
          } else if (img?.url) {
            imageUrl = img.url;
          }
        }
      }
    } catch {
      // Not valid JSON, but might still contain recipe data
      if (
        content.toLowerCase().includes('"recipe"') ||
        content.toLowerCase().includes("ingredient")
      ) {
        recipeJsonLd.push(content);
      }
    }
  }

  if (recipeJsonLd.length > 0) {
    return { text: `[JSON-LD Structured Data]\n${recipeJsonLd.join("\n\n")}`, imageUrl };
  }

  // Return all JSON-LD as fallback
  const allContent = jsonLdBlocks
    .map((b) =>
      b
        .replace(/<script[^>]*>/i, "")
        .replace(/<\/script>/i, "")
        .trim()
    )
    .join("\n\n");
  return {
    text: allContent.length > 50 ? `[JSON-LD Data]\n${allContent}` : null,
    imageUrl,
  };
}

// ===== Extract image URL from HTML meta tags (fallback) =====
function extractImageFromHtml(html: string): string | null {
  // Try Open Graph image
  const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
  if (ogMatch) return ogMatch[1];

  // Try Twitter card image
  const twMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
  if (twMatch) return twMatch[1];

  return null;
}

// ===== Strategy 3: Extract clean text from HTML =====
function extractTextFromHtml(html: string): string {
  // Remove non-content elements
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find main content area
  const mainMatch =
    clean.match(/<main[\s\S]*?<\/main>/i) ||
    clean.match(/<article[\s\S]*?<\/article>/i) ||
    clean.match(/<div[^>]*class="[^"]*recipe[^"]*"[\s\S]*?<\/div>/i) ||
    clean.match(/<div[^>]*class="[^"]*content[^"]*"[\s\S]*?<\/div>/i);

  const contentHtml = mainMatch ? mainMatch[0] : clean;

  // Strip tags and normalize whitespace
  const text = contentHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  try {
    // Always fetch the HTML page first (for JSON-LD, images, meta tags)
    let html = "";
    try {
      const response = await fetch(url, {
        headers: FETCH_HEADERS,
        redirect: "follow",
      });
      if (response.ok) {
        html = await response.text();
      }
    } catch {
      // Fetch failed — continue with API strategy
    }

    // Extract JSON-LD structured data from HTML
    const jsonLdResult = html.length > 100 ? extractJsonLd(html) : { text: null, imageUrl: null };

    // Extract image: prefer JSON-LD, then OG meta tags
    const imageUrl = jsonLdResult.imageUrl || (html.length > 100 ? extractImageFromHtml(html) : null);

    // Extract clean text from HTML
    const pageText = html.length > 100 ? extractTextFromHtml(html) : "";

    // Build the best text result from all strategies
    let resultText = "";
    let source = "html";

    // Best case: JSON-LD with Recipe data
    if (jsonLdResult.text && jsonLdResult.text.length > 200) {
      resultText = jsonLdResult.text;
      source = "json-ld";
      // Supplement with page text for extra context
      if (pageText.length > 100) {
        resultText += `\n\n[Page Text]\n${pageText.substring(0, 15000)}`;
      }
    } else if (pageText.length > 200) {
      // Good HTML text content
      resultText = `[Page Text]\n${pageText}`;
      source = "html";
    }

    // If HTML didn't yield enough, try known API patterns (for SPAs)
    if (resultText.length < 200) {
      const apiText = await tryKnownAPIs(url);
      if (apiText && apiText.length > 200) {
        resultText = apiText;
        source = "api";
      }
    }

    // Nothing worked
    if (resultText.length < 100) {
      return NextResponse.json(
        {
          error: "Wenig Inhalt gefunden. Diese Seite nutzt vermutlich JavaScript zum Laden. Versuche stattdessen ein Foto des Rezepts hochzuladen.",
          partialText: pageText || undefined,
          imageUrl: imageUrl || undefined,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: resultText.substring(0, 50000),
      source,
      imageUrl: imageUrl || undefined,
    });
  } catch (error: any) {
    console.error("Extract text error:", error);
    return NextResponse.json(
      { error: `Fehler beim Laden der Seite: ${error.message}` },
      { status: 500 }
    );
  }
}
