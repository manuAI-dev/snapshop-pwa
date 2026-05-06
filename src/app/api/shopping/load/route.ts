import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET: Load shopping items for a user (includes household items)
// Uses Service Role to bypass RLS issues
export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Config missing" }, { status: 500 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Check if user is in a household
    const { data: membership } = await supabaseAdmin
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .single();

    let query = supabaseAdmin
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (membership?.household_id) {
      // Household member → get all items from all household members
      const { data: members } = await supabaseAdmin
        .from("household_members")
        .select("user_id")
        .eq("household_id", membership.household_id);

      const memberIds = (members || []).map(m => m.user_id);

      if (memberIds.length > 0) {
        query = query.in("user_id", memberIds);
      }
    } else {
      // No household → only own items
      query = query.eq("user_id", userId);
    }

    const { data: items, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
