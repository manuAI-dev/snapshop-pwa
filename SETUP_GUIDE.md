# SnapShop — Setup-Anleitung: Migrations, Stripe & Go-Live

## Übersicht

Diese Anleitung führt dich durch alle nötigen Schritte, um das Payment-System live zu bringen. Zeitaufwand: ca. 1–2 Stunden.

**Reihenfolge:**
1. npm Packages installieren
2. Supabase Migrations ausführen (004, 005, 006)
3. Stripe-Account aufsetzen & Produkt erstellen
4. Environment Variables konfigurieren
5. Stripe Webhook einrichten
6. Lokal testen
7. Deployment

---

## 1. npm Packages installieren

Im Projektordner (`snapshop-pwa`):

```bash
npm install stripe
npm install -D @types/stripe
```

Das `stripe`-Package wird serverseitig in den API-Routes verwendet (Checkout, Webhook, Portal).
`@supabase/supabase-js` sollte bereits installiert sein.

---

## 2. Supabase Migrations ausführen

Gehe ins Supabase Dashboard: https://supabase.com/dashboard → Dein Projekt → **SQL Editor**

Führe die folgenden 3 Migrations **in dieser Reihenfolge** aus:

### Migration 004 — Meal Sources
Datei: `supabase/migration_004_meal_sources.sql`
- Fügt `source_url` und `source_name` Spalten zu `meal_slots` hinzu
- Benötigt für: AI-Wochenplan mit Feed-Rezepten

### Migration 005 — Calorie Tracker
Datei: `supabase/migration_005_calorie_tracker.sql`
- Erstellt `calorie_entries` Tabelle
- Benötigt für: Kalorien-Tracker Feature

### Migration 006 — Subscriptions & Usage
Datei: `supabase/migration_006_subscriptions.sql`
- Erstellt `subscriptions` Tabelle (Tier, Stripe IDs, Billing-Status)
- Erstellt `feature_usage` Tabelle (monatliches Feature-Tracking)
- Erstellt Trigger: Auto-Subscription für neue User
- Benötigt für: Payment-System

**So gehst du vor:**
1. Öffne den SQL Editor in Supabase
2. Kopiere den Inhalt jeder SQL-Datei einzeln
3. Klicke "Run" und warte auf Erfolg
4. Prüfe unter "Table Editor", dass die neuen Tabellen erscheinen

**Wichtig:** Falls du schon bestehende User hast, die noch keinen `subscriptions`-Eintrag haben, führe danach noch aus:
```sql
INSERT INTO subscriptions (user_id, tier)
SELECT id, 'free' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;
```

---

## 3. Stripe-Account aufsetzen

### 3a. Account erstellen
1. Gehe zu https://dashboard.stripe.com/register
2. Registriere dich (E-Mail, Passwort)
3. Du landest automatisch im **Test-Modus** (orange Banner oben)

### 3b. Produkt erstellen
1. Gehe zu **Products** (linke Sidebar) → **+ Add product**
2. Erstelle das Produkt:
   - **Name:** SnapShop Pro
   - **Description:** Das volle Koch-Erlebnis — unbegrenzte Rezepte, AI-Wochenplaner, Kochmodus und mehr.

3. Füge **zwei Preise** hinzu:
   - **Preis 1 (Monatlich):**
     - Betrag: CHF 4.90
     - Billing period: Monthly
     - Klicke "Add price"
   - **Preis 2 (Jährlich):**
     - Betrag: CHF 39.00
     - Billing period: Yearly
     - Klicke "Add price"

4. **Notiere die Price IDs** — du findest sie unter dem jeweiligen Preis:
   - Monatlich: `price_1Xxx...` → das wird `STRIPE_PRICE_MONTHLY`
   - Jährlich: `price_1Yyy...` → das wird `STRIPE_PRICE_YEARLY`

### 3c. API Keys kopieren
1. Gehe zu **Developers** → **API Keys**
2. Kopiere:
   - **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`

---

## 4. Environment Variables konfigurieren

Öffne `.env.local` im Projektordner und ergänze die folgenden Variablen:

```env
# --- Bestehende Vars (sollten schon da sein) ---
NEXT_PUBLIC_SUPABASE_URL=https://dywkecqbpufapjuvluhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...dein-anon-key
ANTHROPIC_API_KEY=sk-ant-...dein-key

# --- NEU: Supabase Service Role Key ---
# Findest du unter: Supabase Dashboard → Settings → API → service_role key
# ACHTUNG: Dieser Key hat vollen DB-Zugriff. Nie im Frontend verwenden!
SUPABASE_SERVICE_ROLE_KEY=eyJ...dein-service-role-key

# --- NEU: Stripe ---
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...  (kommt in Schritt 5)

# --- NEU: App URL ---
NEXT_PUBLIC_APP_URL=http://localhost:3000  (für lokal, später deine Domain)
```

### Wo findest du den Supabase Service Role Key?
1. Supabase Dashboard → **Settings** → **API**
2. Unter "Project API keys" → **service_role** (secret)
3. Klicke "Reveal" und kopiere den Key

---

## 5. Stripe Webhook einrichten

Der Webhook informiert deine App, wenn ein User bezahlt hat, kündigt, etc.

### 5a. Für lokale Entwicklung (Stripe CLI)

1. Installiere Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Oder Download: https://stripe.com/docs/stripe-cli
   ```

2. Einloggen:
   ```bash
   stripe login
   ```

3. Webhook lokal weiterleiten:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Die CLI zeigt dir ein `whsec_...` Secret — kopiere es in `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5b. Für Produktion (Stripe Dashboard)

1. Gehe zu **Developers** → **Webhooks** → **+ Add endpoint**
2. Endpoint URL: `https://deine-domain.com/api/stripe/webhook`
3. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Klicke "Add endpoint"
5. Kopiere das **Signing secret** (`whsec_...`) in deine Produktion-Envvars

---

## 6. Lokal testen

### 6a. App starten
```bash
npm run dev
```

### 6b. Stripe CLI starten (zweites Terminal)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 6c. Test-Durchlauf

1. **Registriere einen neuen User** → prüfe in Supabase, ob `subscriptions`-Eintrag mit `tier: free` erstellt wurde

2. **Feature-Gate testen:**
   - Importiere 3 Rezepte (Foto oder URL) → die ersten 3 sollten funktionieren
   - Beim 4. Import: Paywall-Modal erscheint

3. **Upgrade testen:**
   - Klicke "Pro freischalten" im Paywall-Modal
   - Du wirst zu Stripe Checkout weitergeleitet
   - Verwende die Test-Kreditkarte: `4242 4242 4242 4242`
     - Ablaufdatum: beliebig in der Zukunft (z.B. 12/30)
     - CVC: beliebige 3 Ziffern
     - PLZ: beliebig
   - Nach Zahlung → Redirect zurück zur App mit Erfolgsmeldung
   - Prüfe in Supabase: `subscriptions.tier` sollte jetzt `pro` sein

4. **Pro-Features testen:**
   - Import sollte jetzt wieder funktionieren
   - AI-Planer, Kochmodus etc. sollten freigeschaltet sein

5. **Abo verwalten:**
   - Gehe zu Konto → klicke auf "Pro aktiv" Banner → "Abo verwalten"
   - Stripe Customer Portal öffnet sich (Abo kündigen, Zahlungsmethode ändern)

### Stripe Test-Kreditkarten

| Karte | Beschreibung |
|-------|-------------|
| `4242 4242 4242 4242` | Erfolgreiche Zahlung |
| `4000 0000 0000 3220` | 3D Secure Authentifizierung |
| `4000 0000 0000 0002` | Karte abgelehnt |
| `4000 0000 0000 9995` | Insufficient funds |

---

## 7. Deployment

### 7a. Vercel (empfohlen für Next.js)

1. Pushe den Code zu GitHub/GitLab
2. Verbinde das Repo mit Vercel: https://vercel.com/new
3. Setze **alle Environment Variables** in Vercel:
   - Settings → Environment Variables
   - Alle Vars aus `.env.local` eintragen
   - **WICHTIG:** `NEXT_PUBLIC_APP_URL` auf deine echte Domain setzen

4. Deploye

### 7b. Nach dem Deployment

1. **Stripe Webhook für Produktion einrichten** (siehe 5b)
   - URL: `https://deine-domain.com/api/stripe/webhook`
   - Vergiss nicht, das neue `STRIPE_WEBHOOK_SECRET` in Vercel zu setzen

2. **Stripe auf Live-Modus umschalten:**
   - Im Stripe Dashboard oben: "Test mode" → ausschalten
   - Neue Live-Keys generieren (`sk_live_...`, `pk_live_...`)
   - Neue Live-Preise erstellen (gleiche Beträge)
   - Alle Keys in Vercel aktualisieren

---

## Architektur-Übersicht

```
User klickt "Pro freischalten"
        ↓
Paywall-Modal / Upgrade-Seite
        ↓
POST /api/stripe/checkout
  → Erstellt Stripe Customer (falls neu)
  → Erstellt Checkout Session
  → Speichert customer_id in Supabase
        ↓
Redirect → Stripe Checkout (gehostete Seite)
  → User gibt Kreditkarte ein
  → Zahlung erfolgreich
        ↓
Stripe sendet Webhook → POST /api/stripe/webhook
  → Verifiziert Signatur
  → Aktualisiert subscriptions-Tabelle in Supabase
    (tier: "pro", status: "active", period_end, etc.)
        ↓
Redirect zurück → /konto/upgrade?success=true
  → App lädt Subscription aus Supabase
  → UI zeigt "Pro aktiv"
```

---

## Troubleshooting

### Paywall erscheint nicht
- Prüfe, ob `PaywallModal` im Main-Layout eingebunden ist
- Öffne Browser DevTools → Application → localStorage
- Suche nach `snapshop_usage_monthly` — zeigt aktuelle Nutzungszähler

### Stripe Checkout öffnet sich nicht
- Prüfe Console-Logs auf Fehler bei `/api/stripe/checkout`
- Sind alle `STRIPE_*` Env-Vars gesetzt?
- Ist `stripe` npm Package installiert?
- Fallback: App schaltet Pro direkt frei (ohne Zahlung) wenn Stripe nicht erreichbar

### Webhook kommt nicht an
- Prüfe Stripe Dashboard → Developers → Webhooks → Events
- Lokal: Läuft `stripe listen`?
- Stimmt das `STRIPE_WEBHOOK_SECRET`?

### User ist nach Zahlung noch "free"
- Webhook evtl. noch nicht verarbeitet → warte 5 Sekunden, lade Seite neu
- Prüfe in Supabase → `subscriptions` Tabelle → User-Eintrag
- Prüfe Stripe Dashboard → Customers → Subscription Status

### Supabase "relation does not exist"
- Migrations noch nicht ausgeführt → SQL Editor → Migrations nochmal ausführen
