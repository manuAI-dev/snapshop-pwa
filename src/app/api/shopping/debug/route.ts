import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET: Debug-Endpunkt — zeigt Tabellen-Spalten, testet Insert + Delete
export async function GET(req: NextRequest) {
  const results: any = { timestamp: new Date().toISOString(), tests: {} };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Env vars missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test 1: Tabellen-Spalten lesen
  try {
    const { data, error } = await supabaseAdmin
      .from("shopping_items")
      .select("*")
      .limit(1);
    if (error) {
      results.tests.select = { ok: false, error: error.message, code: error.code };
    } else {
      results.tests.select = {
        ok: true,
        columns: data && data.length > 0 ? Object.keys(data[0]) : "table empty",
        rowCount: data?.length || 0,
        sampleRow: data?.[0] || null,
      };
    }
  } catch (err: any) {
    results.tests.select = { ok: false, error: err.message };
  }

  // Test 2: Alle Items zählen
  try {
    const { count, error } = await supabaseAdmin
      .from("shopping_items")
      .select("*", { count: "exact", head: true });
    results.tests.count = error
      ? { ok: false, error: error.message }
      : { ok: true, totalItems: count };
  } catch (err: any) {
    results.tests.count = { ok: false, error: err.message };
  }

  // Test 3: Insert test (mit sofortigem Delete)
  try {
    const testItem = {
      user_id: "00000000-0000-0000-0000-000000000000",
      name: "__debug_test__",
      quantity: "1",
      unit: "x",
      category: "other",
      is_checked: false,
    };
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("shopping_items")
      .insert(testItem)
      .select();

    if (insertErr) {
      results.tests.insert = { ok: false, error: insertErr.message, code: insertErr.code, details: insertErr.details };
    } else {
      results.tests.insert = { ok: true, insertedId: inserted?.[0]?.id };

      // Sofort wieder löschen
      if (inserted?.[0]?.id) {
        const { error: delErr } = await supabaseAdmin
          .from("shopping_items")
          .delete()
          .eq("id", inserted[0].id);
        results.tests.deleteTest = delErr
          ? { ok: false, error: delErr.message }
          : { ok: true };
      }
    }
  } catch (err: any) {
    results.tests.insert = { ok: false, error: err.message };
  }

  // Test 4: Insert MIT household_id
  try {
    const testItem = {
      user_id: "00000000-0000-0000-0000-000000000000",
      household_id: "test-household",
      name: "__debug_test_hh__",
    };
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("shopping_items")
      .insert(testItem)
      .select();

    if (insertErr) {
      results.tests.insertWithHouseholdId = { ok: false, error: insertErr.message, hint: insertErr.hint };
    } else {
      results.tests.insertWithHouseholdId = { ok: true };
      if (inserted?.[0]?.id) {
        await supabaseAdmin.from("shopping_items").delete().eq("id", inserted[0].id);
      }
    }
  } catch (err: any) {
    results.tests.insertWithHouseholdId = { ok: false, error: err.message };
  }

  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
