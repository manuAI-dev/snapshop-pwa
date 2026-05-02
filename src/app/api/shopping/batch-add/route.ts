import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Shopping-Items batch einfügen (Service Role Key umgeht RLS)
export async function POST(req: NextRequest) {
  // Env-Var Check
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
    const { items, userId } = await req.json();

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "userId and items[] required" },
        { status: 400 }
      );
    }

    const safeItems = items.map((item: any) => {
      const row: any = {
        user_id: userId,
        name: item.name,
        quantity: item.quantity || "",
        unit: item.unit || "",
        category: item.category || "other",
        notes: item.notes || null,
        is_checked: false,
        recipe_id: item.recipe_id || null,
        recipe_name: item.recipe_name || null,
      };
      // household_id nur setzen wenn vorhanden (Spalte existiert evtl. nicht)
      if (item.household_id) row.household_id = item.household_id;
      return row;
    });

    const { data: inserted, error } = await supabaseAdmin
      .from("shopping_items")
      .insert(safeItems)
      .select();

    if (error) {
      console.error("batch-add insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, items: inserted });
  } catch (err: any) {
    console.error("batch-add error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
