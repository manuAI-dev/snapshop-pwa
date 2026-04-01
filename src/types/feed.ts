// Feed / Inspiration types

export interface FeedSource {
  id: string;
  name: string;
  hostname: string;
  logoUrl?: string;       // Placeholder/logo for the source
  color: string;          // Brand color for fallback
  enabled: boolean;
  categories: FeedCategory[];
}

export interface FeedCategory {
  id: string;
  label: string;          // e.g. "Beliebt", "Schnell", "Vegan"
  path: string;           // URL path to scrape
}

export interface FeedItem {
  id: string;             // hash of sourceUrl
  title: string;
  imageUrl: string | null;
  sourceUrl: string;
  sourceId: string;       // e.g. "fooby"
  sourceName: string;     // e.g. "Fooby"
  description?: string;
  prepTime?: string;      // e.g. "30 Min."
  difficulty?: string;
  category?: string;
}

// Preview data from JSON-LD (shown before full import)
export interface FeedPreview {
  title: string;
  description: string;
  imageUrl: string | null;
  sourceUrl: string;
  sourceName: string;
  servings?: number;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients: string[];   // Just names for preview
  cuisine?: string;
  difficulty?: string;
}
