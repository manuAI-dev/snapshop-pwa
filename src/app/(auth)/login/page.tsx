"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { login, isLoading, error, clearError, checkSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      const onboarded = localStorage.getItem("snapshop_onboarded");
      router.push(onboarded ? "/rezepte" : "/onboarding");
    } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFF3EB', padding: '56px 24px 32px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          style={{ width: 50, height: 50, borderRadius: '50%', border: '1px solid #DCDDDC', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <Link href="/register" style={{ color: '#F2894F', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Registrieren
        </Link>
      </div>

      {/* Heading */}
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 600, color: '#4B164C', marginBottom: 8 }}>Login</h1>
      <p style={{ fontSize: 13, color: '#9193A0', marginBottom: 32 }}>Willkommen zurück! Melde dich an.</p>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,73,73,0.1)', color: '#E64949', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <input
          type="email" value={email}
          onChange={(e) => { setEmail(e.target.value); clearError(); }}
          placeholder="E-Mail" required
          style={{ width: '100%', padding: '16px 18px', borderRadius: 15, backgroundColor: '#FCF7F2', border: '2px solid transparent', outline: 'none', fontSize: 14, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"} value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            placeholder="Passwort" required
            style={{ width: '100%', padding: '16px 50px 16px 18px', borderRadius: 15, backgroundColor: '#FCF7F2', border: '2px solid transparent', outline: 'none', fontSize: 14, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2">
              {showPassword ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
            </svg>
          </button>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button type="button" onClick={async () => {
            if (!email) { alert("Bitte gib zuerst deine E-Mail ein."); return; }
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (!error) setResetSent(true);
          }} style={{ background: 'none', border: 'none', color: '#F2894F', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            Passwort vergessen?
          </button>
          {resetSent && <p style={{ fontSize: 12, color: '#2E8D92', marginTop: 4 }}>Link zum Zurücksetzen gesendet!</p>}
        </div>

        <div style={{ paddingTop: 8 }}>
          <button type="submit" disabled={isLoading}
            style={{ width: '100%', padding: 16, borderRadius: 13, backgroundColor: '#F2894F', color: 'white', fontWeight: 600, fontSize: 18, border: 'none', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Anmelden..." : "Login"}
          </button>
        </div>
      </form>

      {/* Social Login */}
      <div style={{ marginTop: 'auto', paddingTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#DCDDDC' }} />
          <span style={{ fontSize: 12, color: '#9193A0' }}>oder</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#DCDDDC' }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 13, border: '1px solid #DCDDDC', backgroundColor: 'white', fontSize: 14, fontWeight: 500, color: '#212022', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 13, border: '1px solid #DCDDDC', backgroundColor: 'white', fontSize: 14, fontWeight: 500, color: '#212022', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#212022"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </button>
        </div>
      </div>
    </div>
  );
}
