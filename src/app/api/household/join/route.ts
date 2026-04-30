import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// POST /api/household/join
// Haushalt beitreten per Einladungscode oder Token
// Nutzt Service Role Key um RLS zu umgehen
// ============================================================

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { type, code, token, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // Prüfe ob User bereits in einem Haushalt ist
    const { data: existingMember } = await supabaseAdmin
      .from("household_members")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "Du bist bereits in einem Haushalt. Verlasse zuerst deinen aktuellen Haushalt." },
        { status: 400 }
      );
    }

    let householdId: string;
    let householdName: string;

    if (type === "code") {
      // ── Join by invite code ──
      if (!code) {
        return NextResponse.json({ error: "Kein Einladungscode angegeben" }, { status: 400 });
      }

      const { data: household, error: hErr } = await supabaseAdmin
        .from("households")
        .select("id, name")
        .eq("invite_code", code.trim().toLowerCase())
        .single();

      if (hErr || !household) {
        console.error("[join/code] Household lookup failed:", hErr);
        return NextResponse.json({ error: "Ungültiger Einladungscode" }, { status: 404 });
      }

      householdId = household.id;
      householdName = household.name;

    } else if (type === "token") {
      // ── Join by invite token (link) ──
      if (!token) {
        return NextResponse.json({ error: "Kein Einladungstoken angegeben" }, { status: 400 });
      }

      const { data: invite, error: iErr } = await supabaseAdmin
        .from("household_invites")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (iErr || !invite) {
        console.error("[join/token] Invite lookup failed:", iErr);
        return NextResponse.json({ error: "Ungültige oder abgelaufene Einladung" }, { status: 404 });
      }

      // Ablauf prüfen
      if (new Date(invite.expires_at) < new Date()) {
        await supabaseAdmin
          .from("household_invites")
          .update({ status: "expired" })
          .eq("id", invite.id);
        return NextResponse.json({ error: "Diese Einladung ist abgelaufen" }, { status: 410 });
      }

      householdId = invite.household_id;

      // Haushaltname laden
      const { data: hh } = await supabaseAdmin
        .from("households")
        .select("name")
        .eq("id", householdId)
        .single();
      householdName = hh?.name || "Haushalt";

      // Einladung als akzeptiert markieren
      await supabaseAdmin
        .from("household_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);

    } else {
      return NextResponse.json({ error: "Ungültiger Typ (code oder token erwartet)" }, { status: 400 });
    }

    // ── Mitglied hinzufügen ──
    const { error: mErr } = await supabaseAdmin
      .from("household_members")
      .insert([{
        household_id: householdId,
        user_id: userId,
        role: "member",
      }]);

    if (mErr) {
      if (mErr.message?.includes("duplicate") || mErr.code === "23505") {
        return NextResponse.json({ error: "Du bist bereits Mitglied dieses Haushalts" }, { status: 409 });
      }
      console.error("[join] Member insert failed:", mErr);
      return NextResponse.json({ error: "Fehler beim Beitreten" }, { status: 500 });
    }

    // ── Bestehende Daten zuordnen ──
    try {
      await supabaseAdmin.rpc("assign_user_data_to_household", {
        p_user_id: userId,
        p_household_id: householdId,
      });
    } catch (rpcErr) {
      // Nicht kritisch — Daten können später noch zugeordnet werden
      console.warn("[join] assign_user_data_to_household failed:", rpcErr);
    }

    return NextResponse.json({
      success: true,
      household_id: householdId,
      household_name: householdName,
    });

  } catch (err: any) {
    console.error("[join] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Unbekannter Fehler" }, { status: 500 });
  }
}
