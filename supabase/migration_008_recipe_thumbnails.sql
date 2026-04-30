-- ============================================================
-- SnapShop: Recipe Thumbnails für schnelle Listenanzeige
-- Migration 008
--
-- Problem: recipe_images enthält grosse Base64-Strings (200KB-1MB)
-- die bei jedem Laden der Rezeptliste übertragen werden.
--
-- Lösung: Kleine thumbnail Spalte (~5-10KB) für Listenansicht.
-- ============================================================

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS thumbnail TEXT;
