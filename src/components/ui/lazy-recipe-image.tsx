"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Lazy-loaded Rezeptbild — nutzt Thumbnail wenn vorhanden,
 * lädt sonst aus DB nach. In-Memory Cache für Performance.
 */

// In-Memory Cache
const imageCache = new Map<string, string>();

interface LazyRecipeImageProps {
  recipeId: string;
  thumbnail?: string;
  alt?: string;
  style?: React.CSSProperties;
  fallbackGradient?: string;
}

export function LazyRecipeImage({
  recipeId,
  thumbnail,
  alt = "",
  style,
  fallbackGradient = "linear-gradient(135deg, #F2894F 0%, #CC3D10 100%)",
}: LazyRecipeImageProps) {
  // Sofort Thumbnail nutzen wenn vorhanden
  const cached = imageCache.get(recipeId);
  const immediate = thumbnail || cached;

  const [src, setSrc] = useState<string | null>(immediate || null);
  const [loading, setLoading] = useState(!immediate);

  useEffect(() => {
    // Thumbnail oder Cache verfügbar → fertig
    if (thumbnail) {
      imageCache.set(recipeId, thumbnail);
      setSrc(thumbnail);
      setLoading(false);
      return;
    }
    if (imageCache.has(recipeId)) {
      setSrc(imageCache.get(recipeId)!);
      setLoading(false);
      return;
    }

    // Fallback: Thumbnail aus DB laden (nur wenn kein Thumbnail im Rezept)
    let cancelled = false;
    const loadImage = async () => {
      try {
        const { data } = await supabase
          .from("recipes")
          .select("thumbnail")
          .eq("id", recipeId)
          .single();

        if (!cancelled && data?.thumbnail) {
          imageCache.set(recipeId, data.thumbnail);
          setSrc(data.thumbnail);
        }
      } catch {
        // Silent fail — Gradient als Fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadImage();
    return () => { cancelled = true; };
  }, [recipeId, thumbnail]);

  if (!src) {
    return <div style={{ ...style, background: fallbackGradient }} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{ ...style, objectFit: "cover" }}
    />
  );
}
