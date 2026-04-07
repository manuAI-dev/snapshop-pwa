"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useHouseholdStore } from "@/stores/household-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { DIETARY_OPTIONS, ALLERGY_OPTIONS } from "@/types/household";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SnapShopLogo } from "@/components/ui/app-header";
import { PwaInstallBanner } from "@/components/ui/pwa-install-prompt";

export default function KontoPage() {
  const { user, logout } = useAuthStore();
  // recipes removed - stats row no longer shown
  const { household, members, invites, isLoading: hhLoading, loadHousehold, createHousehold, updateHouseholdProfile, inviteByEmail, generateInviteLink, joinByCode, removeMember, leaveHousehold, deleteHousehold, error: hhError, clearError: clearHhError } = useHouseholdStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showHhCreate, setShowHhCreate] = useState(false);
  const [showHhJoin, setShowHhJoin] = useState(false);
  const [showHhInvite, setShowHhInvite] = useState(false);
  const [hhName, setHhName] = useState("Unser Haushalt");
  const [hhJoinCode, setHhJoinCode] = useState("");
  const [hhInviteEmail, setHhInviteEmail] = useState("");
  const [hhInviteLink, setHhInviteLink] = useState<string | null>(null);
  const [hhActionLoading, setHhActionLoading] = useState(false);
  const [hhSuccess, setHhSuccess] = useState<string | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);


  useEffect(() => { loadHousehold(); }, [loadHousehold]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("snapshop_profile_image");
      if (saved) setProfileImage(saved);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const compressed = canvas.toDataURL("image/jpeg", 0.8);
        setProfileImage(compressed);
        localStorage.setItem("snapshop_profile_image", compressed);
        window.dispatchEvent(new Event("profileImageChanged"));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() || "?";
  // Stats removed

  // ============================================================
  // Shared Card Style
  // ============================================================
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: '20px 18px',
    boxShadow: '0 1px 8px rgba(75,22,76,0.04)',
  };

  return (
    <div style={{ backgroundColor: '#FFF3EB', minHeight: '100vh', paddingBottom: 100 }}>

      {/* ====== LIGHT HEADER with profile ====== */}
      <div style={{
        padding: '52px 20px 20px',
        background: 'linear-gradient(180deg, #FFF3EB 0%, #FFF3EB 100%)',
      }}>
        {/* Top row: Logo + Abmelden */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SnapShopLogo size={20} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 700, color: '#4B164C' }}>Mein Konto</span>
          </div>
          <span style={{ fontSize: 11, color: '#D4C9BF' }}>v1.0</span>
        </div>

        {/* Profile row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              border: '3px solid #F2894F',
              backgroundColor: profileImage ? 'transparent' : '#F2894F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, overflow: 'hidden', flexShrink: 0, position: 'relative',
            }}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 700, color: 'white', fontFamily: "'Montserrat', sans-serif" }}>{initials}</span>
            )}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: '50%',
              backgroundColor: '#4B164C', border: '2px solid #FFF3EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />

          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 700, color: '#212022', marginBottom: 2, lineHeight: 1.2 }}>
              {user?.name || "User"}
            </h2>
            <p style={{ fontSize: 12, color: '#9193A0' }}>{user?.email || ""}</p>
          </div>
        </div>

      </div>

      {/* ====== PWA INSTALL REMINDER ====== */}
      <div style={{ paddingTop: 12 }}>
        <PwaInstallBanner />
      </div>

      {/* ====== SUBSCRIPTION STATUS ====== */}
      <SubscriptionBanner />

      {/* ====== EINSTELLUNGEN ====== */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ ...cardStyle }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9193A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Einstellungen</p>
          {[
            { label: "Haushalt", desc: household ? `${members.length} Mitglieder` : "Familie oder WG einrichten", color: "#7B2D7D", icon: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", action: () => { const el = document.getElementById('haushalt-section'); el?.scrollIntoView({ behavior: 'smooth' }); } },
            { label: "Hilfe & Feedback", desc: "Fragen oder Vorschläge?", color: "#2E8D92", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01", action: () => { window.location.href = "mailto:support@wesnapshop.ch?subject=SnapShop Feedback"; } },
          ].map(({ label, desc, color, icon, action }, i, arr) => (
            <button key={label} onClick={action} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0',
              borderBottom: i < arr.length - 1 ? '1px solid #F5F0EC' : 'none',
              width: '100%', background: 'none', border: 'none', borderBottomStyle: i < arr.length - 1 ? 'solid' : 'none',
              borderBottomWidth: 1, borderBottomColor: '#F5F0EC', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: `${color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#212022', display: 'block', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</span>
                {desc && <span style={{ fontSize: 11, color: '#9193A0' }}>{desc}</span>}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4C9BF" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          ))}
        </div>
      </div>

      {/* ====== ABMELDEN ====== */}
      <div style={{ padding: '12px 20px 0' }}>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '14px 18px', borderRadius: 14,
          backgroundColor: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E64949" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#E64949', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Abmelden</span>
        </button>
      </div>

      {/* ====== HAUSHALT SECTION ====== */}
      <div id="haushalt-section" style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 700, color: '#4B164C' }}>Haushalt</span>
        </div>

        {hhError && (
          <div style={{ backgroundColor: 'rgba(230,73,73,0.1)', color: '#E64949', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>
            {hhError}
            <button onClick={clearHhError} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#E64949', fontWeight: 700, cursor: 'pointer' }}>×</button>
          </div>
        )}
        {hhSuccess && (
          <div style={{ backgroundColor: 'rgba(46,141,146,0.1)', color: '#2E8D92', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>{hhSuccess}</div>
        )}

        {household ? (
          <div style={{ ...cardStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#212022', fontFamily: "'Montserrat', sans-serif" }}>{household.name}</h3>
                <p style={{ fontSize: 12, color: '#9193A0', marginTop: 2 }}>Code: <span style={{ fontWeight: 600, color: '#F2894F', letterSpacing: 1 }}>{household.inviteCode.toUpperCase()}</span></p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
            </div>

            {/* Mitglieder */}
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9193A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {members.length} {members.length === 1 ? 'Mitglied' : 'Mitglieder'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {members.map((m) => (
                <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: m.role === 'owner' ? '#F2894F' : '#E1BEE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                    {(m.name || m.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#212022', display: 'block' }}>
                      {m.name || m.email || 'Unbekannt'}
                      {m.userId === user?.id && <span style={{ fontSize: 11, color: '#9193A0', marginLeft: 4 }}>(du)</span>}
                    </span>
                    <span style={{ fontSize: 11, color: m.role === 'owner' ? '#F2894F' : '#9193A0' }}>{m.role === 'owner' ? 'Admin' : 'Mitglied'}</span>
                  </div>
                  {household.ownerId === user?.id && m.userId !== user?.id && (
                    <button onClick={() => { if (confirm(`${m.name || 'Mitglied'} entfernen?`)) removeMember(m.userId); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Familienplaner-Profil */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowProfileEditor(!showProfileEditor)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, #F3E5F5, #FCE4EC)',
                  borderRadius: 14, padding: '14px 16px', border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4B164C', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Familienplaner-Profil</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {household.profile.adults + household.profile.children > 0 && (
                    <span style={{ fontSize: 11, color: '#9193A0' }}>{household.profile.adults + household.profile.children} Pers.</span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2" style={{ transform: showProfileEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </button>

              {showProfileEditor && (
                <div style={{ backgroundColor: '#F9F6F2', borderRadius: '0 0 14px 14px', padding: '16px', marginTop: -4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9193A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Haushaltsgrösse</p>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                    {[{ label: "Erwachsene", key: "adults" as const, min: 1 }, { label: "Kinder", key: "children" as const, min: 0 }].map(({ label, key, min }) => (
                      <div key={key} style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, color: '#525154', marginBottom: 6 }}>{label}</p>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, overflow: 'hidden' }}>
                          <button onClick={() => updateHouseholdProfile({ [key]: Math.max(min, household.profile[key] - 1) })} style={{ width: 36, height: 36, border: 'none', backgroundColor: 'transparent', fontSize: 18, color: '#F2894F', cursor: 'pointer', fontWeight: 700 }}>−</button>
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#212022' }}>{household.profile[key]}</span>
                          <button onClick={() => updateHouseholdProfile({ [key]: Math.min(10, household.profile[key] + 1) })} style={{ width: 36, height: 36, border: 'none', backgroundColor: 'transparent', fontSize: 18, color: '#F2894F', cursor: 'pointer', fontWeight: 700 }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9193A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ernährungsweise</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                    {DIETARY_OPTIONS.map((opt) => {
                      const isActive = household.profile.dietary.includes(opt);
                      return (
                        <button key={opt} onClick={() => { const next = isActive ? household.profile.dietary.filter(d => d !== opt) : [...household.profile.dietary, opt]; updateHouseholdProfile({ dietary: next }); }}
                          style={{ padding: '7px 14px', borderRadius: 20, backgroundColor: isActive ? '#4B164C' : 'white', color: isActive ? 'white' : '#525154', fontSize: 12, fontWeight: isActive ? 600 : 400, border: isActive ? 'none' : '1px solid #E0D5CA', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >{opt}</button>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9193A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Allergien & Unverträglichkeiten</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                    {ALLERGY_OPTIONS.map((opt) => {
                      const isActive = household.profile.allergies.includes(opt);
                      return (
                        <button key={opt} onClick={() => { const next = isActive ? household.profile.allergies.filter(a => a !== opt) : [...household.profile.allergies, opt]; updateHouseholdProfile({ allergies: next }); }}
                          style={{ padding: '7px 14px', borderRadius: 20, backgroundColor: isActive ? '#E64949' : 'white', color: isActive ? 'white' : '#525154', fontSize: 12, fontWeight: isActive ? 600 : 400, border: isActive ? 'none' : '1px solid #E0D5CA', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >{opt}</button>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9193A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Verfügbare Kochzeit</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[{ label: "Wochentags", key: "cookingTimeWeekday" as const }, { label: "Wochenende", key: "cookingTimeWeekend" as const }].map(({ label, key }) => (
                      <div key={key} style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11, color: '#9193A0', marginBottom: 6 }}>{label}</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <select value={household.profile[key]} onChange={(e) => updateHouseholdProfile({ [key]: parseInt(e.target.value) })}
                            style={{ fontSize: 20, fontWeight: 700, color: '#212022', border: 'none', backgroundColor: 'transparent', outline: 'none', fontFamily: "'Montserrat', sans-serif", cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239193A0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', paddingRight: 18 }}
                          >
                            {[15, 20, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <span style={{ fontSize: 12, color: '#9193A0' }}>Min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: '#9193A0', marginTop: 14, lineHeight: 1.4, textAlign: 'center' }}>
                    Wird für den AI-Wochenplaner verwendet.
                  </p>
                </div>
              )}
            </div>

            {invites.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9193A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Offene Einladungen</p>
                {invites.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FFE082' }} />
                    <span style={{ fontSize: 13, color: '#525154', flex: 1 }}>{inv.email || 'Link-Einladung'}</span>
                    <span style={{ fontSize: 11, color: '#C0C0C0' }}>ausstehend</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowHhInvite(true)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, backgroundColor: '#F2894F', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Einladen
              </button>
              <button
                onClick={() => { household.ownerId === user?.id ? (confirm('Haushalt wirklich löschen?') && deleteHousehold()) : (confirm('Haushalt verlassen?') && leaveHousehold()); }}
                style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(230,73,73,0.08)', color: '#E64949', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {household.ownerId === user?.id ? 'Löschen' : 'Verlassen'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '24px 18px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#212022', fontFamily: "'Montserrat', sans-serif", marginBottom: 6 }}>Haushalt teilen</h3>
            <p style={{ fontSize: 13, color: '#9193A0', lineHeight: 1.4, marginBottom: 20 }}>Teile Rezepte und Einkaufslisten mit deiner Familie oder WG.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowHhCreate(true)} style={{ flex: 1, padding: '14px 0', borderRadius: 12, backgroundColor: '#F2894F', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Erstellen</button>
              <button onClick={() => setShowHhJoin(true)} style={{ flex: 1, padding: '14px 0', borderRadius: 12, backgroundColor: 'white', color: '#4B164C', fontWeight: 700, fontSize: 14, border: '2px solid #E0D5CA', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Beitreten</button>
            </div>
          </div>
        )}
      </div>

      {/* Version */}
      <div style={{ textAlign: 'center', padding: '28px 20px 0' }}>
        <p style={{ fontSize: 10, color: '#D4C9BF' }}>SnapShop v1.0</p>
      </div>

      {/* ====== MODALS ====== */}

      {showHhCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFF3EB', borderRadius: '24px 24px 0 0', padding: '32px 24px 40px', width: '100%', maxWidth: 420 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', fontFamily: "'Montserrat', sans-serif", marginBottom: 16, textAlign: 'center' }}>Haushalt erstellen</h3>
            <input type="text" value={hhName} onChange={(e) => setHhName(e.target.value)} placeholder="Name des Haushalts"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, backgroundColor: 'white', border: '2px solid #E0D5CA', outline: 'none', fontSize: 15, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowHhCreate(false)} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: 'white', color: '#9193A0', fontWeight: 600, fontSize: 14, border: '1px solid #E0D5CA', cursor: 'pointer' }}>Abbrechen</button>
              <button disabled={hhActionLoading || !hhName.trim()} onClick={async () => { setHhActionLoading(true); try { await createHousehold(hhName.trim()); setShowHhCreate(false); setHhSuccess('Haushalt erstellt!'); setTimeout(() => setHhSuccess(null), 3000); } catch {} setHhActionLoading(false); }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F2894F', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: hhActionLoading ? 0.6 : 1 }}
              >{hhActionLoading ? '...' : 'Erstellen'}</button>
            </div>
          </div>
        </div>
      )}

      {showHhJoin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFF3EB', borderRadius: '24px 24px 0 0', padding: '32px 24px 40px', width: '100%', maxWidth: 420 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', fontFamily: "'Montserrat', sans-serif", marginBottom: 8, textAlign: 'center' }}>Haushalt beitreten</h3>
            <p style={{ fontSize: 13, color: '#9193A0', textAlign: 'center', marginBottom: 16 }}>Gib den Einladungscode ein.</p>
            <input type="text" value={hhJoinCode} onChange={(e) => setHhJoinCode(e.target.value.toUpperCase())} placeholder="z.B. A1B2C3D4" maxLength={12}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, backgroundColor: 'white', border: '2px solid #E0D5CA', outline: 'none', fontSize: 18, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box', marginBottom: 16, textAlign: 'center', letterSpacing: 3, fontWeight: 700 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowHhJoin(false); setHhJoinCode(''); }} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: 'white', color: '#9193A0', fontWeight: 600, fontSize: 14, border: '1px solid #E0D5CA', cursor: 'pointer' }}>Abbrechen</button>
              <button disabled={hhActionLoading || !hhJoinCode.trim()} onClick={async () => { setHhActionLoading(true); try { await joinByCode(hhJoinCode.trim()); setShowHhJoin(false); setHhJoinCode(''); setHhSuccess('Beigetreten!'); setTimeout(() => setHhSuccess(null), 3000); } catch {} setHhActionLoading(false); }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#4B164C', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: hhActionLoading ? 0.6 : 1 }}
              >{hhActionLoading ? '...' : 'Beitreten'}</button>
            </div>
          </div>
        </div>
      )}

      {showHhInvite && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFF3EB', borderRadius: '24px 24px 0 0', padding: '32px 24px 40px', width: '100%', maxWidth: 420 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', fontFamily: "'Montserrat', sans-serif", marginBottom: 16, textAlign: 'center' }}>Person einladen</h3>

            <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#212022', marginBottom: 8 }}>Code teilen</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: '#F9F6F2', borderRadius: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#F2894F', letterSpacing: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{household?.inviteCode.toUpperCase()}</span>
                <button onClick={() => { navigator.clipboard?.writeText(household?.inviteCode.toUpperCase() || ''); setHhSuccess('Kopiert!'); setTimeout(() => setHhSuccess(null), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#212022', marginBottom: 8 }}>Einladungslink</p>
              {hhInviteLink ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input readOnly value={hhInviteLink} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, backgroundColor: '#F9F6F2', border: 'none', fontSize: 12, color: '#525154', outline: 'none' }} />
                  <button onClick={() => { navigator.clipboard?.writeText(hhInviteLink); setHhSuccess('Link kopiert!'); setTimeout(() => setHhSuccess(null), 2000); }}
                    style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: '#F2894F', color: 'white', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer' }}>Kopieren</button>
                </div>
              ) : (
                <button onClick={async () => { try { const link = await generateInviteLink(); setHhInviteLink(link); } catch {} }}
                  style={{ width: '100%', padding: 10, borderRadius: 10, backgroundColor: '#F3E5F5', color: '#4B164C', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>Link generieren</button>
              )}
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#212022', marginBottom: 8 }}>Per E-Mail</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="email" value={hhInviteEmail} onChange={(e) => setHhInviteEmail(e.target.value)} placeholder="partner@email.com"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, backgroundColor: '#F9F6F2', border: '2px solid transparent', outline: 'none', fontSize: 14, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <button disabled={!hhInviteEmail.includes('@')} onClick={async () => { try { await inviteByEmail(hhInviteEmail); setHhInviteEmail(''); setHhSuccess('Gesendet!'); setTimeout(() => setHhSuccess(null), 3000); } catch {} }}
                  style={{ padding: '10px 16px', borderRadius: 10, backgroundColor: hhInviteEmail.includes('@') ? '#F2894F' : '#E0D5CA', color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: hhInviteEmail.includes('@') ? 'pointer' : 'not-allowed' }}>Senden</button>
              </div>
            </div>

            <button onClick={() => { setShowHhInvite(false); setHhInviteLink(null); setHhInviteEmail(''); }}
              style={{ width: '100%', padding: 14, borderRadius: 12, backgroundColor: 'white', color: '#9193A0', fontWeight: 600, fontSize: 14, border: '1px solid #E0D5CA', cursor: 'pointer' }}>Schliessen</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Subscription Banner — zeigt aktuellen Plan + Upgrade-Link
// ============================================================

function SubscriptionBanner() {
  const { tier } = useSubscriptionStore();
  const router = useRouter();
  const isPro = tier === "pro";

  return (
    <div style={{ padding: "12px 20px 0" }}>
      <button
        onClick={() => router.push("/konto/upgrade")}
        style={{
          width: "100%", padding: "14px 18px", borderRadius: 16,
          border: "none", cursor: "pointer", textAlign: "left",
          background: isPro
            ? "linear-gradient(135deg, #F2894F 0%, #E06930 100%)"
            : "white",
          boxShadow: isPro
            ? "0 4px 16px rgba(242,137,79,0.2)"
            : "0 2px 8px rgba(0,0,0,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{isPro ? "✨" : "🚀"}</span>
          <div>
            <p style={{
              fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 700,
              color: isPro ? "white" : "#212022", margin: 0,
            }}>
              {isPro ? "Pro aktiv" : "Upgrade auf Pro"}
            </p>
            <p style={{
              fontSize: 11, margin: "2px 0 0",
              color: isPro ? "rgba(255,255,255,0.75)" : "#9193A0",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {isPro ? "Alle Features freigeschaltet" : "Unbegrenzte Rezepte & AI-Features"}
            </p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isPro ? "white" : "#C4B8AC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
