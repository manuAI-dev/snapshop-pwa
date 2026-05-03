import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Mehrere Shopping-Items gleichzeitig updaten (Service Role Key umgeht RLS)
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server-Konfiguration fehlt" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { updates, userId } = await req.json();
    // updates = [{ id: string, quantity: string }, ...]

    if (!userId || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "userId and updates[] required" },
        { status: 400 }
      );
    }

    const ids = updates.map((u: any) => u.id);

    // Sicherheitscheck: Alle Items gehören dem User (oder Haushalt)
    const { data: items } = await supabaseAdmin
      .from("shopping_items")
      .select("id, user_id, household_id")
      .in("id", ids);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items not found" }, { status: 404 });
    }

    // Haushalt des Users ermitteln
    const { data: userItems } = await supabaseAdmin
      .from("shopping_items")
      .select("household_id")
      .eq("user_id", userId)
      .limit(1);
    const userHouseholdId = userItems?.[0]?.household_id || null;

    const authorizedIds = new Set(
      items
        .filter((item: any) => {
          if (item.user_id === userId) return true;
          if (userHouseholdId && item.household_id === userHouseholdId) return true;
          return false;
        })
        .map((item: any) => item.id)
    );

    // Updates ausführen (nur autorisierte)
    let updatedCount = 0;
    for (const upd of updates) {
      if (!authorizedIds.has(upd.id)) continue;

      const safeUpdates: any = {};
      if (upd.quantity !== undefined) safeUpdates.quantity = upd.quantity;
      if (upd.name !== undefined) safeUpdates.name = upd.name;
      if (upd.unit !== undefined) safeUpdates.unit = upd.unit;
      if (upd.notes !== undefined) safeUpdates.notes = upd.notes;

      if (Object.keys(safeUpdates).length === 0) continue;

      const { error } = await supabaseAdmin
        .from("shopping_items")
        .update(safeUpdates)
        .eq("id", upd.id);

      if (!error) updatedCount++;
    }

    return NextResponse.json({ success: true, updated: updatedCount });
  } catch (err: any) {
    console.error("batch-update error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
