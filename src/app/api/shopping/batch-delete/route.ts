import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Shopping-Items löschen (Service Role Key umgeht RLS)
export async function POST(req: NextRequest) {
  const { ids, userId } = await req.json();

  if (!userId || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "userId and ids[] required" },
      { status: 400 }
    );
  }

  // Sicherheitscheck: Nur Items löschen die dem User/Haushalt gehören
  const { data: items } = await supabaseAdmin
    .from("shopping_items")
    .select("id, user_id, household_id")
    .in("id", ids);

  if (!items || items.length === 0) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  // Nur IDs die dem User gehören oder zum selben Haushalt
  const safeIds = items
    .filter((item: any) => item.user_id === userId)
    .map((item: any) => item.id);

  if (safeIds.length === 0) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("shopping_items")
    .delete()
    .in("id", safeIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: safeIds.length });
}
