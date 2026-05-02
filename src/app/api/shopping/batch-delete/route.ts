import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Shopping-Items löschen (Service Role Key umgeht RLS)
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
    const { ids, userId } = await req.json();

    if (!userId || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "userId and ids[] required" },
        { status: 400 }
      );
    }

    // Nur Items löschen die dem User gehören
    const { data: items } = await supabaseAdmin
      .from("shopping_items")
      .select("id, user_id")
      .in("id", ids);

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

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
      console.error("batch-delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: safeIds.length });
  } catch (err: any) {
    console.error("batch-delete error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
