"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useCalorieStore } from "@/stores/calorie-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { CalorieMealType, calorieMealLabels } from "@/types/calorie";
import AppHeader from "@/components/ui/app-header";

const DAILY_GOAL = 2000; // kcal default

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const mealTypes: CalorieMealType[] = ["frühstück", "mittagessen", "abendessen", "snack"];

export default function KalorienPage() {
  const { entries, loadEntries, addEntry, removeEntry, getDaySummary } = useCalorieStore();
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMealType, setAddMealType] = useState<CalorieMealType>("mittagessen");

  const dateStr = formatDate(selectedDate);
  const isToday = dateStr === formatDate(getToday());

  // Load 2 weeks of data around current date
  useEffect(() => {
    const start = addDays(selectedDate, -7);
    const end = addDays(selectedDate, 7);
    loadEntries(formatDate(start), formatDate(end));
  }, [selectedDate, loadEntries]);

  const summary = useMemo(() => getDaySummary(dateStr), [dateStr, entries, getDaySummary]);

  const caloriePercent = Math.min(100, Math.round((summary.totalCalories / DAILY_GOAL) * 100));
  const remaining = Math.max(0, DAILY_GOAL - summary.totalCalories);

  // Week bar chart data
  const weekData = useMemo(() => {
    const days = [];
    const monday = new Date(selectedDate);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      const ds = formatDate(d);
      const dayEntries = entries.filter(e => e.date === ds);
      const total = dayEntries.reduce((s, e) => s + e.calories, 0);
      days.push({
        date: ds,
        label: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i],
        total,
        isSelected: ds === dateStr,
        isToday: ds === formatDate(getToday()),
      });
    }
    return days;
  }, [selectedDate, entries, dateStr]);

  const maxWeek = Math.max(DAILY_GOAL, ...weekData.map(d => d.total));

  const openAdd = (mt: CalorieMealType) => {
    setAddMealType(mt);
    setShowAddModal(true);
  };

  const dateLabel = selectedDate.toLocaleDateString("de-CH", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div style={{ backgroundColor: '#FFF3EB', minHeight: '100vh', paddingBottom: 90 }}>
      <AppHeader title="Kalorien" />

      {/* Date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 0' }}>
        <button onClick={() => setSelectedDate(prev => addDays(prev, -1))} style={{ background: 'none', border: 'none', padding: 10, cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#462F4D" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button
          onClick={() => setSelectedDate(getToday())}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}
        >
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 600, color: '#1E1F28', margin: 0 }}>
            {isToday ? "Heute" : dateLabel}
          </p>
          {isToday && (
            <p style={{ fontSize: 11, color: '#9193A0', margin: 0 }}>{dateLabel}</p>
          )}
        </button>
        <button onClick={() => setSelectedDate(prev => addDays(prev, 1))} style={{ background: 'none', border: 'none', padding: 10, cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#462F4D" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      {/* Circular progress */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 8px' }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="58" fill="none" stroke="#EDE5DA" strokeWidth="10" />
            <circle
              cx="70" cy="70" r="58" fill="none"
              stroke={caloriePercent >= 100 ? '#E64949' : '#F2894F'}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(caloriePercent / 100) * 364.4} 364.4`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 700, color: '#1E1F28', lineHeight: '32px' }}>
              {summary.totalCalories}
            </span>
            <span style={{ fontSize: 11, color: '#9193A0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              von {DAILY_GOAL} kcal
            </span>
          </div>
        </div>
      </div>

      {/* Macros summary */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '0 20px 12px' }}>
        {[
          { label: "Noch übrig", value: `${remaining}`, unit: "kcal", color: "#F2894F" },
          { label: "Protein", value: `${Math.round(summary.totalProtein)}`, unit: "g", color: "#7B2D7D" },
          { label: "Carbs", value: `${Math.round(summary.totalCarbs)}`, unit: "g", color: "#E67E22" },
          { label: "Fett", value: `${Math.round(summary.totalFat)}`, unit: "g", color: "#3498DB" },
        ].map((m) => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: "'Montserrat', sans-serif", margin: 0 }}>
              {m.value}<span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
            </p>
            <p style={{ fontSize: 10, color: '#9193A0', margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Week mini-chart */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56, padding: '0 4px' }}>
          {weekData.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(new Date(day.date + "T12:00:00"))}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{
                width: '100%', borderRadius: 4,
                height: Math.max(4, (day.total / maxWeek) * 36),
                backgroundColor: day.isSelected ? '#F2894F' : (day.total > DAILY_GOAL ? 'rgba(230,73,73,0.4)' : '#EDE5DA'),
                transition: 'all 0.2s',
              }} />
              <span style={{
                fontSize: 9, fontWeight: day.isSelected ? 700 : 400,
                color: day.isToday ? '#F2894F' : (day.isSelected ? '#462F4D' : '#9193A0'),
              }}>
                {day.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Meal sections */}
      <div style={{ padding: '0 20px' }}>
        {mealTypes.map((mt) => {
          const mealEntries = summary.entries.filter(e => e.mealType === mt);
          const mealCal = mealEntries.reduce((s, e) => s + e.calories, 0);

          return (
            <div key={mt} style={{ marginBottom: 12 }}>
              {/* Meal type header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 600, color: '#462F4D',
                    fontFamily: "'Montserrat', sans-serif",
                  }}>
                    {calorieMealLabels[mt]}
                  </span>
                  {mealCal > 0 && (
                    <span style={{ fontSize: 11, color: '#9193A0', fontWeight: 500 }}>{mealCal} kcal</span>
                  )}
                </div>
                <button
                  onClick={() => openAdd(mt)}
                  style={{
                    background: 'none', border: '1.5px solid #D4C9BF', borderRadius: 8,
                    padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  <span style={{ fontSize: 11, color: '#F2894F', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Hinzufügen</span>
                </button>
              </div>

              {/* Entries */}
              {mealEntries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mealEntries.map((entry) => (
                    <div key={entry.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      backgroundColor: '#FCF7F2', borderRadius: 12, padding: '10px 12px',
                    }}>
                      {/* Photo or icon */}
                      {entry.photoUrl ? (
                        <img loading="lazy" decoding="async" src={entry.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(242,137,79,0.15), rgba(75,22,76,0.1))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z M21 15v7" />
                          </svg>
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                          {entry.title}
                        </p>
                        <p style={{ fontSize: 11, color: '#9193A0', margin: 0 }}>
                          {entry.calories} kcal
                          {entry.protein ? ` · ${entry.protein}g P` : ""}
                          {entry.carbs ? ` · ${entry.carbs}g K` : ""}
                          {entry.fat ? ` · ${entry.fat}g F` : ""}
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeEntry(entry.id)}
                        style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4C9BF" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '12px', borderRadius: 12, border: '1.5px dashed #EDE5DA',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 12, color: '#C4B8AC', margin: 0 }}>Noch nichts eingetragen</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <AddCalorieModal
          mealType={addMealType}
          date={dateStr}
          onAdd={async (entry) => {
            await addEntry(entry);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}


/* ============================================================
   Add Calorie Entry Modal
   ============================================================ */
function AddCalorieModal({ mealType, date, onAdd, onClose }: {
  mealType: CalorieMealType;
  date: string;
  onAdd: (entry: any) => void;
  onClose: () => void;
}) {
  const { useFeature: useSubFeature } = useSubscriptionStore();
  const [title, setTitle] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Foto aufnehmen / auswählen
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Gate: caloriePhoto (AI-Foto-Analyse)
    if (!useSubFeature("caloriePhoto")) return;

    // Preview anzeigen (komprimiert)
    try {
      const { compressImage } = await import("@/utils/compress-image");
      const compressed = await compressImage(file, 800, 0.7);
      setPhotoPreview(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    // AI-Analyse des Fotos (Kalorien schätzen)
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/calorie/analyze", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title) setTitle(data.title);
        if (data.calories) setCalories(String(data.calories));
        if (data.protein) setProtein(String(data.protein));
        if (data.carbs) setCarbs(String(data.carbs));
        if (data.fat) setFat(String(data.fat));
      }
    } catch {
      // AI analysis failed — user can still enter manually
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = () => {
    if (!title || !calories) return;
    onAdd({
      date,
      mealType,
      title,
      calories: Number(calories),
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
      photoUrl: photoPreview || undefined,
    });
  };

  // Quick-add presets
  const presets = [
    { label: "Kaffee", cal: 5, p: 0, c: 0, f: 0 },
    { label: "Müesli mit Milch", cal: 380, p: 12, c: 58, f: 10 },
    { label: "Sandwich", cal: 420, p: 18, c: 48, f: 16 },
    { label: "Salat", cal: 250, p: 8, c: 20, f: 14 },
    { label: "Pasta", cal: 520, p: 18, c: 72, f: 12 },
    { label: "Snack / Riegel", cal: 180, p: 4, c: 24, f: 8 },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#FFF3EB', borderRadius: '24px 24px 0 0',
        padding: '24px 20px', width: '100%', maxWidth: 480,
        maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 700, color: '#462F4D', margin: 0 }}>
            {calorieMealLabels[mealType]} hinzufügen
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Foto-Button */}
        <div style={{ marginBottom: 16 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />
          {photoPreview ? (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
              <img loading="lazy" decoding="async" src={photoPreview} alt="Gericht" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
              {isAnalyzing && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>AI analysiert...</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                border: '2px dashed #D4C9BF', backgroundColor: 'rgba(242,137,79,0.04)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              <span style={{ fontSize: 13, color: '#F2894F', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Foto aufnehmen — AI schätzt Kalorien
              </span>
            </button>
          )}
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setTitle(p.label);
                setCalories(String(p.cal));
                setProtein(String(p.p));
                setCarbs(String(p.c));
                setFat(String(p.f));
              }}
              style={{
                padding: '5px 12px', borderRadius: 16,
                border: title === p.label ? '1.5px solid #F2894F' : '1.5px solid #EDE5DA',
                backgroundColor: title === p.label ? 'rgba(242,137,79,0.08)' : 'transparent',
                color: title === p.label ? '#F2894F' : '#7A6E6E',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {p.label} · {p.cal}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Name des Gerichts"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1.5px solid #EDE5DA', backgroundColor: '#FCF7F2',
              fontSize: 14, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none', boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: '#9193A0', fontWeight: 600, marginBottom: 2, display: 'block' }}>Kalorien (kcal)*</label>
              <input
                type="number" value={calories} onChange={(e) => setCalories(e.target.value)}
                placeholder="z.B. 450"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #EDE5DA', backgroundColor: '#FCF7F2',
                  fontSize: 14, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9193A0', fontWeight: 600, marginBottom: 2, display: 'block' }}>Protein (g)</label>
              <input
                type="number" value={protein} onChange={(e) => setProtein(e.target.value)}
                placeholder="z.B. 25"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #EDE5DA', backgroundColor: '#FCF7F2',
                  fontSize: 14, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9193A0', fontWeight: 600, marginBottom: 2, display: 'block' }}>Kohlenhydrate (g)</label>
              <input
                type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)}
                placeholder="z.B. 55"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #EDE5DA', backgroundColor: '#FCF7F2',
                  fontSize: 14, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9193A0', fontWeight: 600, marginBottom: 2, display: 'block' }}>Fett (g)</label>
              <input
                type="number" value={fat} onChange={(e) => setFat(e.target.value)}
                placeholder="z.B. 18"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #EDE5DA', backgroundColor: '#FCF7F2',
                  fontSize: 14, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title || !calories}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 16,
            background: (!title || !calories) ? '#D4C9BF' : 'linear-gradient(135deg, #F2894F, #E67A3C)',
            color: 'white', fontWeight: 700, fontSize: 15,
            border: 'none', cursor: (!title || !calories) ? 'not-allowed' : 'pointer',
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Eintragen
        </button>

        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
