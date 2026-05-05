import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Assign household_id to all user data that's missing it
// Uses Service Role to bypass RLS
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server config missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { userId, householdId } = await req.json();

    if (!userId || !householdId) {
      return NextResponse.json({ error: "userId and householdId required" }, { status: 400 });
    }

    // Verify user is actually a member of this household
    const { data: membership } = await supabaseAdmin
      .from("household_members")
      .select("id")
      .eq("user_id", userId)
      .eq("household_id", householdId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this household" }, { status: 403 });
    }

    // Assign household_id to all user's items that don't have one
    const [shopResult, recipeResult, mealResult] = await Promise.all([
      supabaseAdmin
        .from("shopping_items")
        .update({ household_id: householdId })
        .eq("user_id", userId)
        .is("household_id", null),
      supabaseAdmin
        .from("recipes")
        .update({ household_id: householdId })
        .eq("user_id", userId)
        .is("household_id", null),
      supabaseAdmin
        .from("meal_slots")
        .update({ household_id: householdId })
        .eq("user_id", userId)
        .is("household_id", null),
    ]);

    return NextResponse.json({
      success: true,
      updated: {
        shopping_items: shopResult.error ? 0 : (shopResult.count || 0),
        recipes: recipeResult.error ? 0 : (recipeResult.count || 0),
        meal_slots: mealResult.error ? 0 : (mealResult.count || 0),
      },
    });
  } catch (err: any) {
    console.error("sync-data error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
