import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Shopping-Item updaten (Service Role Key umgeht RLS)
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      { error: "Server-Konfiguration fehlt (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { id, updates, userId } = await req.json();

    if (!id || !userId || !updates) {
      return NextResponse.json(
        { error: "id, userId, and updates required" },
        { status: 400 }
      );
    }

    // Sicherheitscheck: Item gehört dem User
    const { data: item } = await supabaseAdmin
      .from("shopping_items")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!item || item.user_id !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const safeUpdates: any = {};
    if (updates.is_checked !== undefined) safeUpdates.is_checked = updates.is_checked;
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.quantity !== undefined) safeUpdates.quantity = updates.quantity;
    if (updates.unit !== undefined) safeUpdates.unit = updates.unit;

    const { error } = await supabaseAdmin
      .from("shopping_items")
      .update(safeUpdates)
      .eq("id", id);

    if (error) {
      console.error("update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("update error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
