"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const { register, isLoading, error, clearError, checkSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm || !acceptTerms) return;
    try {
      await register(email, password, name);
      router.push("/onboarding");
    } catch (err: any) {
      if (err?.message === "CONFIRM_EMAIL") {
        setConfirmEmail(true);
      }
    }
  };

  if (confirmEmail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3EB', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
        </div>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 600, color: '#4B164C', marginBottom: 8 }}>Check deine E-Mails!</h2>
        <p style={{ fontSize: 14, color: '#9193A0', marginBottom: 32, maxWidth: 300 }}>
          Wir haben dir eine Bestätigungs-E-Mail an <strong style={{ color: '#212022' }}>{email}</strong> geschickt. Klicke auf den Link um dein Konto zu aktivieren.
        </p>
        <button onClick={() => router.push('/login')}
          style={{ padding: '14px 32px', borderRadius: 13, backgroundColor: '#F2894F', color: 'white', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>
          Zum Login
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '16px 18px', borderRadius: 15, backgroundColor: '#FCF7F2',
    border: '2px solid transparent', outline: 'none', fontSize: 14, color: '#212022',
    fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFF3EB', padding: '56px 24px 32px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <button onClick={() => router.back()}
          style={{ width: 50, height: 50, borderRadius: '50%', border: '1px solid #DCDDDC', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <Link href="/login" style={{ color: '#F2894F', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Login</Link>
      </div>

      {/* Heading */}
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 600, color: '#4B164C', marginBottom: 8 }}>Registrieren</h1>
      <p style={{ fontSize: 13, color: '#9193A0', marginBottom: 32 }}>Erstelle dein Konto und starte mit SnapShop.</p>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,73,73,0.1)', color: '#E64949', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>{error}</div>
      )}
      {password && passwordConfirm && password !== passwordConfirm && (
        <div style={{ backgroundColor: 'rgba(230,73,73,0.1)', color: '#E64949', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>Passwörter stimmen nicht überein</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <input type="text" value={name} onChange={(e) => { setName(e.target.value); clearError(); }} placeholder="Name" required style={inputStyle} />
        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} placeholder="E-Mail" required style={inputStyle} />
        <div style={{ position: 'relative' }}>
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} placeholder="Passwort" required minLength={6}
            style={{ ...inputStyle, paddingRight: 50 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2">
              {showPassword ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
            </svg>
          </button>
        </div>
        {password && password.length < 6 && (
          <p style={{ fontSize: 11, color: '#9193A0', marginTop: -8 }}>Mindestens 6 Zeichen</p>
        )}
        <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Passwort wiederholen" required minLength={6} style={inputStyle} />

        {/* Terms */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 4, cursor: 'pointer' }}
          onClick={() => setAcceptTerms((v) => !v)}>
          <input type="checkbox" checked={acceptTerms} readOnly
            style={{ marginTop: 3, width: 18, height: 18, minWidth: 18, accentColor: '#F2894F', cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: '#9193A0', lineHeight: 1.4 }}>
            Ich akzeptiere die{" "}
            <a href="#" onClick={(e) => { e.stopPropagation(); e.preventDefault(); /* TODO: open terms */ }}
              style={{ color: '#F2894F', fontWeight: 500, textDecoration: 'underline', fontSize: 12 }}>
              Nutzungsbedingungen
            </a>
          </span>
        </div>

        <div style={{ paddingTop: 8 }}>
          <button type="submit" disabled={isLoading || !acceptTerms}
            style={{ width: '100%', padding: 16, borderRadius: 13, backgroundColor: (!acceptTerms) ? '#E7DEC4' : '#F2894F', color: (!acceptTerms) ? '#9193A0' : 'white', fontWeight: 600, fontSize: 18, border: 'none', cursor: (!acceptTerms) ? 'not-allowed' : 'pointer' }}>
            {isLoading ? "Registrieren..." : "Registrieren"}
          </button>
        </div>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#9193A0', marginTop: 24 }}>
        Bereits registriert?{" "}
        <Link href="/login" style={{ color: '#F2894F', fontWeight: 600, textDecoration: 'none' }}>Anmelden</Link>
      </p>
    </div>
  );
}
