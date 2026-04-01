# SnapShop — Supabase Setup Anleitung

Folge diesen 5 Schritten **in der Reihenfolge**, um die App mit Supabase zu verbinden.

---

## Schritt 1: Alte Dateien löschen

Öffne ein Terminal im Projektordner `snapshop-pwa` und lösche diese 5 Dateien, die nicht mehr gebraucht werden:

```bash
rm src/lib/appwrite.ts
rm src/lib/auth-service.ts
rm src/lib/recipe-service.ts
rm src/lib/local-storage.ts
rm src/lib/shopping-service.ts
```

Oder lösche sie manuell im Finder/Explorer unter `src/lib/`.

**Warum?** Diese Dateien gehörten zum alten Appwrite-Backend. Alle Stores und Pages nutzen jetzt Supabase direkt — kein Code referenziert diese Dateien noch.

---

## Schritt 2: Supabase-Projekt erstellen

1. Gehe zu **[supabase.com](https://supabase.com)** und klicke oben rechts auf **"Start your project"**
2. Melde dich an (GitHub-Login geht am schnellsten)
3. Im Dashboard klicke auf **"New Project"**
4. Fülle das Formular aus:
   - **Organization**: Wähle deine bestehende Org oder erstelle eine neue (z.B. "SnapShop")
   - **Name**: `snapshop`
   - **Database Password**: Wähle ein starkes Passwort — **speichere es irgendwo sicher ab** (z.B. Passwort-Manager). Du brauchst es später falls du direkt auf die DB zugreifen willst.
   - **Region**: Wähle **Central EU (Frankfurt)** — das ist am nächsten für deutsche Nutzer
   - **Pricing Plan**: Free reicht für den Start
5. Klicke auf **"Create new project"**
6. **Warte 2-3 Minuten** bis das Projekt fertig erstellt ist (der Ladebalken verschwindet)

---

## Schritt 3: API-Schlüssel in `.env.local` eintragen

### 3a — Schlüssel finden

1. Im Supabase Dashboard deines neuen Projekts, klicke links in der Sidebar auf das **Zahnrad-Icon** → **"Settings"**
2. Dann klicke auf **"API"** (unter "Configuration")
3. Du siehst jetzt zwei wichtige Werte:

   | Feld | Was es ist |
   |------|-----------|
   | **Project URL** | Sieht so aus: `https://abcdefghijk.supabase.co` |
   | **anon public** (unter "Project API keys") | Ein langer Key, beginnt mit `eyJ...` |

4. **Kopiere beide Werte** (Klick auf das Copy-Icon rechts)

### 3b — In die App eintragen

1. Öffne die Datei `.env.local` im Root des Projekts (`snapshop-pwa/.env.local`)
2. Ersetze die Platzhalter mit deinen echten Werten:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://DEINE-PROJEKT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.DEIN-LANGER-KEY...

# Anthropic Claude API (bleibt wie es ist)
ANTHROPIC_API_KEY=sk-ant-api03-...dein-bestehender-key...
```

**Wichtig:**
- Keine Leerzeichen um das `=` Zeichen
- Kein Trailing-Slash am Ende der URL (also `https://abc.supabase.co` statt `https://abc.supabase.co/`)
- Den ANTHROPIC_API_KEY nicht verändern — der bleibt wie er ist

---

## Schritt 4: Datenbank-Schema erstellen (SQL-Migration)

Dieser Schritt erstellt alle Tabellen, Sicherheitsregeln und Trigger in deiner Supabase-Datenbank.

### 4a — SQL Editor öffnen

1. Im Supabase Dashboard, klicke links in der Sidebar auf das **Datenbank-Icon** mit dem Label **"SQL Editor"**
2. Klicke auf **"New query"** (oben links, grüner Button)

### 4b — SQL einfügen

1. Öffne die Datei `supabase/migrations/001_initial_schema.sql` im Projekt
2. **Kopiere den gesamten Inhalt** (ca. 154 Zeilen)
3. **Füge ihn in den SQL Editor** im Browser ein (alles in das leere Textfeld)

### 4c — Ausführen

1. Klicke auf **"Run"** (oben rechts, oder `Cmd+Enter` / `Ctrl+Enter`)
2. Unten sollte **"Success. No rows returned"** erscheinen — das ist korrekt!

### 4d — Überprüfen

1. Klicke links auf **"Table Editor"** (Tabellen-Icon)
2. Du solltest jetzt **5 Tabellen** sehen:
   - `profiles` — Benutzerprofile
   - `recipes` — Rezepte
   - `ingredients` — Zutaten (gehören zu Rezepten)
   - `shopping_items` — Einkaufsliste
   - `meal_slots` — Wochenplaner-Einträge

Wenn alle 5 da sind: perfekt, die Migration hat geklappt!

**Falls ein Fehler kommt:**
- Lies die rote Fehlermeldung — meistens steht die Zeile dabei
- Häufigster Fehler: Die Migration wurde doppelt ausgeführt → "relation already exists". In dem Fall ist alles ok, die Tabellen existieren bereits.
- Falls ein anderer Fehler kommt, schick mir den Text

---

## Schritt 5: Dependencies installieren

Öffne ein Terminal im Projektordner `snapshop-pwa` und führe aus:

```bash
npm install
```

Das installiert alle Pakete, einschließlich des neuen `@supabase/supabase-js` SDK.

### Überprüfen ob alles stimmt

Danach starte die App:

```bash
npm run dev
```

Die App sollte jetzt auf `http://localhost:3000` laufen. Teste:

1. **Registrieren** — Erstelle einen neuen Account (E-Mail + Passwort, min. 6 Zeichen)
2. **Bestätigungs-E-Mail** — Supabase schickt standardmäßig eine Bestätigungs-E-Mail. Für den Anfang kannst du das deaktivieren:
   - Im Supabase Dashboard → **Authentication** → **Providers** → **Email**
   - Schalte **"Confirm email"** aus (Toggle)
   - Dann kannst du dich sofort nach der Registrierung einloggen
3. **Rezept erstellen** — Teste ob ein Rezept in der DB landet
4. **Einkaufsliste** — Füge Items hinzu und checke ob sie gespeichert werden

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| "Failed to fetch" beim Login | Überprüfe ob `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` korrekt sind. Starte den Dev-Server neu nach Änderungen an `.env.local`. |
| "Invalid login credentials" | E-Mail oder Passwort falsch, oder Account existiert noch nicht → erst registrieren |
| "User already registered" | Account existiert schon → nutze Login statt Registrierung |
| "row level security violation" | Entweder nicht eingeloggt, oder die RLS Policies fehlen → SQL-Migration nochmal prüfen |
| "relation does not exist" | SQL-Migration wurde nicht ausgeführt → Schritt 4 wiederholen |
| Bestätigungs-E-Mail kommt nicht | Entweder "Confirm email" deaktivieren (siehe 5.2) oder Spam-Ordner checken |
