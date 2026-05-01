import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Shopping-Items batch einfügen (Service Role Key umgeht RLS)
export async function POST(req: NextRequest) {
  const { items, userId } = await req.json();

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "userId and items[] required" },
      { status: 400 }
    );
  }

  // Sicherheitscheck: user_id in allen Items muss übereinstimmen
  const safeItems = items.map((item: any) => ({
    user_id: userId,
    household_id: item.household_id || null,
    name: item.name,
    quantity: item.quantity || "",
    unit: item.unit || "",
    category: item.category || "other",
    notes: item.notes || null,
    is_checked: false,
    recipe_id: item.recipe_id || null,
    recipe_name: item.recipe_name || null,
  }));

  const { data: inserted, error } = await supabaseAdmin
    .from("shopping_items")
    .insert(safeItems)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, items: inserted });
}
