import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Client schickt generiertes Thumbnail, Server speichert es
export async function POST(req: NextRequest) {
  const { recipeId, thumbnail } = await req.json();

  if (!recipeId || !thumbnail) {
    return NextResponse.json({ error: "recipeId and thumbnail required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("recipes")
    .update({ thumbnail })
    .eq("id", recipeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
