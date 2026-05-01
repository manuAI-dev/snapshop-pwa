import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Rezept + Zutaten löschen (Service Role Key umgeht RLS)
export async function POST(req: NextRequest) {
  const { recipeId, userId } = await req.json();

  if (!recipeId || !userId) {
    return NextResponse.json({ error: "recipeId and userId required" }, { status: 400 });
  }

  // Sicherheitscheck: Rezept gehört dem User
  const { data: recipe } = await supabaseAdmin
    .from("recipes")
    .select("id, user_id")
    .eq("id", recipeId)
    .single();

  if (!recipe || recipe.user_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Zutaten löschen
  await supabaseAdmin.from("ingredients").delete().eq("recipe_id", recipeId);

  // Rezept löschen
  const { error } = await supabaseAdmin
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
