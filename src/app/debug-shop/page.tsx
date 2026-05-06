"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useShoppingStore } from "@/stores/shopping-store";

export default function DebugShopPage() {
  const [info, setInfo] = useState<any>({ status: "loading..." });
  const { items, isLoading, categories, recipeGroups, loadShoppingList } = useShoppingStore();
  const [storeLoaded, setStoreLoaded] = useState(false);

  // Load the store just like the real page does
  useEffect(() => {
    loadShoppingList(); setStoreLoaded(true);
  }, [loadShoppingList]);

  useEffect(() => {
    async function test() {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
          setInfo({ status: "NO USER", authErr: authErr?.message });
          return;
        }

        const res = await fetch(`/api/shopping/load?userId=${user.id}`);
        const json = await res.json();

        setInfo({
          status: "OK",
          userId: user.id,
          email: user.email,
          apiItemCount: json.items?.length || 0,
          apiFirstItem: json.items?.[0]?.name || "none",
        });
      } catch (err: any) {
        setInfo({ status: "ERROR", message: err.message });
      }
    }
    test();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
      <h2>Shopping Debug</h2>
      <h3>API Test:</h3>
      {JSON.stringify(info, null, 2)}
      <h3>Store State (after loadShoppingList):</h3>
      {JSON.stringify({
        storeLoaded,
        isLoading,
        storeItemCount: items.length,
        storeFirstItem: items[0]?.name || "none",
        categoriesCount: categories.length,
        recipeGroupsCount: recipeGroups.length,
        allItemNames: items.map(i => i.name),
      }, null, 2)}
    </div>
  );
}
