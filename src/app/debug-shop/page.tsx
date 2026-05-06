"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugShopPage() {
  const [info, setInfo] = useState<any>({ status: "loading..." });

  useEffect(() => {
    async function test() {
      try {
        // 1. Get current user
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
          setInfo({ status: "NO USER", authErr: authErr?.message });
          return;
        }

        // 2. Call the API
        const res = await fetch(`/api/shopping/load?userId=${user.id}`);
        const json = await res.json();

        // 3. Also test direct supabase query (RLS)
        const { data: directItems, error: directErr } = await supabase
          .from("shopping_items")
          .select("id, name, user_id")
          .limit(5);

        setInfo({
          status: "OK",
          userId: user.id,
          email: user.email,
          apiItemCount: json.items?.length || 0,
          apiFirstItem: json.items?.[0]?.name || "none",
          apiError: json.error || null,
          directRlsCount: directItems?.length || 0,
          directRlsError: directErr?.message || null,
          directFirstItem: directItems?.[0]?.name || "none",
        });
      } catch (err: any) {
        setInfo({ status: "ERROR", message: err.message });
      }
    }
    test();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap" }}>
      <h2>Shopping Debug</h2>
      {JSON.stringify(info, null, 2)}
    </div>
  );
}
