import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET: Debug household data visibility
// Zeigt was ein User sieht vs. was in der DB existiert
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

  // 1. Household membership
  const { data: memberships } = await supabaseAdmin
    .from("household_members")
    .select("*, households(id, name, owner_id)")
    .eq("user_id", userId);

  // 2. All members in same household
  const householdId = memberships?.[0]?.household_id;
  let allMembers: any[] = [];
  if (householdId) {
    const { data } = await supabaseAdmin
      .from("household_members")
      .select("user_id, role")
      .eq("household_id", householdId);
    allMembers = data || [];
  }

  // 3. Count shopping items per user in household
  const memberIds = allMembers.map(m => m.user_id);
  const shoppingCounts: Record<string, { total: number; withHouseholdId: number; withoutHouseholdId: number }> = {};

  for (const memberId of memberIds) {
    const { count: total } = await supabaseAdmin
      .from("shopping_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId);

    const { count: withHH } = await supabaseAdmin
      .from("shopping_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId)
      .not("household_id", "is", null);

    const { count: withoutHH } = await supabaseAdmin
      .from("shopping_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId)
      .is("household_id", null);

    shoppingCounts[memberId] = {
      total: total || 0,
      withHouseholdId: withHH || 0,
      withoutHouseholdId: withoutHH || 0,
    };
  }

  // 4. Count recipes per user
  const recipeCounts: Record<string, { total: number; withHouseholdId: number; withoutHouseholdId: number }> = {};

  for (const memberId of memberIds) {
    const { count: total } = await supabaseAdmin
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId);

    const { count: withHH } = await supabaseAdmin
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId)
      .not("household_id", "is", null);

    const { count: withoutHH } = await supabaseAdmin
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId)
      .is("household_id", null);

    recipeCounts[memberId] = {
      total: total || 0,
      withHouseholdId: withHH || 0,
      withoutHouseholdId: withoutHH || 0,
    };
  }

  // 5. List all RLS policies on shopping_items
  const { data: policies } = await supabaseAdmin.rpc("get_policies_for_table", {
    table_name: "shopping_items",
  }).maybeSingle();

  // Fallback: query pg_policies directly
  const { data: pgPolicies } = await supabaseAdmin
    .from("pg_policies")
    .select("*")
    .eq("tablename", "shopping_items");

  return NextResponse.json({
    userId,
    householdId,
    memberships,
    allMembers,
    shoppingCounts,
    recipeCounts,
    pgPolicies: pgPolicies || "could not query pg_policies",
  });
}
