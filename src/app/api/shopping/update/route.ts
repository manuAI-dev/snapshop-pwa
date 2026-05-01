import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Shopping-Item updaten (Service Role Key umgeht RLS)
export async function POST(req: NextRequest) {
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

  // Nur erlaubte Felder updaten
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
