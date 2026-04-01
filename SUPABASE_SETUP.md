# Supabase Setup Guide für SnapShop PWA

Diese Anleitung führt dich durch die Einrichtung von Supabase für die SnapShop PWA.

## Schritt 1: Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und melde dich an
2. Klicke auf "New Project"
3. Gib einen Projektnamen ein (z.B. "snapshop")
4. Wähle eine Region (z.B. eu-west-1 für Europa)
5. Setze ein starkes Passwort für die Datenbank
6. Klicke auf "Create new project"

Das Projekt wird erstellt. Warte auf die Fertigstellung (2-3 Minuten).

## Schritt 2: API-Schlüssel kopieren

1. Im Supabase Dashboard gehe zu "Settings" > "API"
2. Kopiere die folgenden Werte:
   - **Project URL** - dies ist dein `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** - dies ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Schritt 3: .env.local aktualisieren

Öffne `.env.local` im Projektroot und füge ein:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Die anderen Variablen (ANTHROPIC_API_KEY) bleiben erhalten.

## Schritt 4: Datenbank-Schema ausführen

1. Gehe im Supabase Dashboard zu "SQL Editor"
2. Klicke auf "New Query"
3. Kopiere den gesamten Inhalt aus `/supabase/migrations/001_initial_schema.sql`
4. Füge ihn in den SQL Editor ein
5. Klicke auf "Run" (oder drücke Ctrl+Enter)

Das Schema wird erstellt:
- Tabellen: `profiles`, `recipes`, `ingredients`, `shopping_items`, `meal_slots`
- Row Level Security (RLS) Policies für Datenschutz
- Trigger für `updated_at` und Auto-Profile-Erstellung
- Indizes für bessere Performance

## Schritt 5: Storage Bucket für Rezeptbilder (optional)

1. Gehe im Supabase Dashboard zu "Storage" > "Buckets"
2. Klicke auf "New bucket"
3. Nenne ihn "recipe-images"
4. Wähle "Public" (damit Bilder öffentlich sichtbar sind)
5. Klicke auf "Create bucket"

Dann führe im SQL Editor aus:

```sql
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true);
```

## Schritt 6: Authentication einrichten

1. Gehe zu "Authentication" > "Providers"
2. Aktiviere mindestens einen Provider:
   - **Email** - Standard, aktiviert durch default
   - **Google** (optional, für Social Login)
   - **GitHub** (optional, für Social Login)

Für Email-Provider:
- Gehe zu "Email" und stelle sicher, dass es aktiviert ist
- Du kannst SMTP-Einstellungen unter "Settings" > "SMTP" konfigurieren (optional)

## Schritt 7: Testet die Verbindung

Im Projekt, nach `npm install`:

```bash
npm run dev
```

Die App sollte sich mit Supabase verbinden. Teste:
1. Registrierung/Login
2. Rezept erstellen
3. Einkaufsliste hinzufügen

## Häufige Fehler

### "Cannot GET /auth/v1/authorize"
- Deine Environment-Variablen sind nicht richtig gesetzt
- Stelle sicher, dass `NEXT_PUBLIC_SUPABASE_URL` ohne Trailing-Slash ist

### "row level security violation"
- Dein Token ist ungültig oder abgelaufen
- Stelle sicher, dass du angemeldet bist

### "relation does not exist"
- Die SQL-Migration wurde nicht vollständig ausgeführt
- Führe die Migration erneut aus und überprüfe auf Fehler

## Datenbankstruktur

### profiles
- `id` (UUID, PK) - Verknüpft mit auth.users
- `name` - Benutzer-Name
- `email` - E-Mail-Adresse
- `profile_image` - URL zum Profilbild
- `created_at` - Erstellungsdatum

### recipes
- `id` (UUID, PK)
- `user_id` - Referenz zu auth.users
- `dish_name` - Name des Gerichts
- `cuisine` - Art der Küche (z.B. "Italian")
- `description` - Beschreibung
- `servings` - Anzahl Portionen
- `prep_time` - Vorbereitung in Minuten
- `cook_time` - Kochzeit in Minuten
- `difficulty` - easy/medium/hard
- `rating` - Bewertung 1-5
- `is_favorite` - Favoriten-Markierung
- `source_url` - Original-URL (falls importiert)
- `nutrition` - JSON mit Nährwertangaben
- `instructions` - Array von Anweisungen
- `recipe_images` - Array von Bild-URLs/Base64
- `created_at`, `updated_at` - Zeitstempel

### ingredients
- `id` (UUID, PK)
- `recipe_id` - Referenz zu recipes
- `name` - Zutat
- `quantity` - Menge (z.B. "2")
- `unit` - Einheit (z.B. "cups")
- `category` - Kategorie (z.B. "vegetables")
- `group_name` - Optionale Gruppierung
- `notes` - Notizen
- `is_selected` - Zur Einkaufsliste hinzugefügt?
- `sort_order` - Sortierung

### shopping_items
- `id` (UUID, PK)
- `user_id` - Referenz zu auth.users
- `name` - Artikel-Name
- `quantity` - Menge
- `unit` - Einheit
- `category` - Kategorie
- `notes` - Notizen
- `is_checked` - Gekauft?
- `recipe_id` - Optional: Quelle-Rezept
- `recipe_name` - Optional: Name des Rezepts
- `created_at` - Erstellungsdatum

### meal_slots
- `id` (UUID, PK)
- `user_id` - Referenz zu auth.users
- `recipe_id` - Rezept-ID
- `recipe_name` - Rezept-Name
- `recipe_image` - Rezept-Bild
- `date` - Datum (YYYY-MM-DD)
- `meal_type` - frühstück/mittagessen/abendessen/snack
- `servings` - Anzahl Portionen
- `created_at` - Erstellt am

## Environment-Variablen Vollständig

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Google Places
# GOOGLE_PLACES_API_KEY=...
```

## Support

Für Fragen zur Supabase-Einrichtung siehe:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Dokumentation](https://www.postgresql.org/docs/)
