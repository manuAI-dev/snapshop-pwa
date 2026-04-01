"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/ui/bottom-nav";
import ScanModal from "@/components/recipe/scan-modal";
import PaywallModal from "@/components/ui/paywall-modal";
import { useAuthStore } from "@/stores/auth-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const { loadSubscription } = useSubscriptionStore();
  const [scanOpen, setScanOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Subscription-State beim App-Start laden
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#FEF1E8', borderTopColor: '#F2894F' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#FFF3EB' }}>
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav onScanPress={() => setScanOpen(true)} />
      <ScanModal isOpen={scanOpen} onClose={() => setScanOpen(false)} />
      <PaywallModal />
    </div>
  );
}
