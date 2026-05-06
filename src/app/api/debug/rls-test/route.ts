import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET: Test RLS by impersonating a user
// /api/debug/rls-test?userId=xxx
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Config missing" }, { status: 500 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  // 1. Test with Service Role (bypasses RLS) - what SHOULD be visible
  const { data: adminShopping, error: adminErr } = await supabaseAdmin
    .from("shopping_items")
    .select("id, name, user_id, household_id")
    .or(`user_id.eq.${userId},household_id.in.(select household_id from household_members where user_id='${userId}')`)
    .limit(10);

  // 2. Get all items in the household
  const { data: membership } = await supabaseAdmin
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .single();

  let householdItems: any = null;
  if (membership?.household_id) {
    const { data, error } = await supabaseAdmin
      .from("shopping_items")
      .select("id, name, user_id, household_id, is_checked")
      .eq("household_id", membership.household_id)
      .limit(20);
    householdItems = { data, error: error?.message };
  }

  // 3. Test what getUserHouseholdId would return
  const { data: hhData, error: hhErr } = await supabaseAdmin
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .single();

  // 4. Simulate the exact shopping store query (no user_id filter when household exists)
  // Using service role but filtering same way the frontend does
  let storeSimulation: any = null;
  if (hhData?.household_id) {
    // Frontend does: no filter, relies on RLS
    // We simulate: get all items where RLS SHOULD grant access
    const { data, error } = await supabaseAdmin
      .from("shopping_items")
      .select("*")
      .or(
        `user_id.eq.${userId},household_id.eq.${hhData.household_id}`
      )
      .order("created_at", { ascending: false })
      .limit(20);
    storeSimulation = {
      count: data?.length || 0,
      items: data?.map(i => ({ id: i.id, name: i.name, user_id: i.user_id, household_id: i.household_id })),
      error: error?.message,
    };
  }

  // 5. Check all policies on shopping_items
  const { data: policies, error: polErr } = await supabaseAdmin
    .rpc("exec_sql", {
      sql: "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'shopping_items'"
    });

  // Fallback: try information_schema
  let policyInfo: any = policies;
  if (polErr) {
    // Try direct query
    const { data: p2, error: p2Err } = await supabaseAdmin
      .from("pg_catalog.pg_policies" as any)
      .select("policyname,cmd")
      .eq("tablename", "shopping_items");
    policyInfo = p2 || p2Err?.message || "Cannot query policies";
  }

  return NextResponse.json({
    userId,
    getUserHouseholdIdResult: hhData?.household_id || null,
    getUserHouseholdIdError: hhErr?.message || null,
    householdItems,
    storeSimulation,
    policyInfo,
  });
}
