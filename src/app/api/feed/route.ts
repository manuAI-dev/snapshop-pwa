// Feed API: Serves curated recipe listings + preview data
// GET /api/feed?sources=fooby,bettybossi  → mixed FeedItem[]
// GET /api/feed?source=fooby              → single source FeedItem[]
// GET /api/feed?preview=URL               → FeedPreview (JSON-LD from page)

import { NextRequest, NextResponse } from "next/server";
import { getRecipesForSource, getMixedFeed, FEED_SOURCES } from "@/data/feed-sources";

export const maxDuration = 30;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.7",
  "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
};

// ============================================================
// Preview: Fetch JSON-LD from individual recipe page
// ============================================================

function formatIso8601Time(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || "0");
  const mins = parseInt(match[2] || "0");
  const total = hours * 60 + mins;
  return total > 0 ? `${total} Min.` : undefined;
}

async function fetchRecipePreview(url: string): Promise<any | null> {
  try {
    const response = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" });
    if (!response.ok) return null;
    const html = await response.text();

    // Extract JSON-LD Recipe
    const jsonLdBlocks = html.match(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    if (jsonLdBlocks) {
      for (const block of jsonLdBlocks) {
        const content = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        try {
          const parsed = JSON.parse(content);
          let recipe = null;
          if (parsed["@type"] === "Recipe") recipe = parsed;
          else if (Array.isArray(parsed["@graph"]))
            recipe = parsed["@graph"].find((n: any) => n["@type"] === "Recipe");

          if (recipe) {
            const ingredients: string[] = [];
            if (Array.isArray(recipe.recipeIngredient))
              ingredients.push(...recipe.recipeIngredient.slice(0, 20));

            return {
              title: recipe.name || "",
              description: recipe.description || "",
              imageUrl: typeof recipe.image === "string" ? recipe.image
                : Array.isArray(recipe.image) ? recipe.image[0]
                : recipe.image?.url || null,
              servings: parseInt(recipe.recipeYield) || undefined,
              prepTime: formatIso8601Time(recipe.prepTime),
              cookTime: formatIso8601Time(recipe.cookTime),
              totalTime: formatIso8601Time(recipe.totalTime),
              ingredients,
              cuisine: recipe.recipeCuisine,
              difficulty: recipe.difficulty,
            };
          }
        } catch { /* skip */ }
      }
    }

    // Fallback: OG meta tags
    const ogTitle = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i)?.[1];
    const ogDesc = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i)?.[1];
    const ogImage = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i)?.[1];

    if (ogTitle) {
      return { title: ogTitle, description: ogDesc || "", imageUrl: ogImage || null, ingredients: [] };
    }
  } catch (error) {
    console.error("Preview fetch error:", error);
  }
  return null;
}

// ============================================================
// Route handler
// ============================================================

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source");
  const sources = request.nextUrl.searchParams.get("sources");
  const previewUrl = request.nextUrl.searchParams.get("preview");

  // Preview mode
  if (previewUrl) {
    const preview = await fetchRecipePreview(previewUrl);
    if (!preview) {
      return NextResponse.json({ error: "Rezeptvorschau konnte nicht geladen werden." }, { status: 422 });
    }
    return NextResponse.json(preview);
  }

  // Feed mode
  let feedItems;
  if (sources) {
    // Multiple sources: mixed feed
    const sourceIds = sources.split(",").filter(Boolean);
    feedItems = getMixedFeed(sourceIds);
  } else if (source) {
    // Single source
    feedItems = getRecipesForSource(source);
  } else {
    // Default: all enabled
    feedItems = getMixedFeed(FEED_SOURCES.map((s) => s.id));
  }

  return NextResponse.json({
    items: feedItems,
    availableSources: FEED_SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      hostname: s.hostname,
      recipeCount: s.recipes.length,
    })),
    count: feedItems.length,
  });
}
