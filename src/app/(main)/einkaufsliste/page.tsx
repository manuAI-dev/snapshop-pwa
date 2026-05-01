"use client";

import { useEffect, useState } from "react";
import { useShoppingStore } from "@/stores/shopping-store";
import { useAuthStore } from "@/stores/auth-store";
import { ShoppingItem } from "@/types/shopping";
import AppHeader from "@/components/ui/app-header";

type ViewMode = "kategorie" | "rezepte";

export default function EinkaufslistePage() {
  const { items, categories, recipeGroups, checkedItems, customItems, isLoading, loadShoppingList, toggleItem, updateItem, deleteItem, addCustomItem, clearList, removeRecipeBatch, removeAllRecipeItems, addRecipeBatch } = useShoppingStore();
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>("kategorie");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => { loadShoppingList(); }, [loadShoppingList]);

  const uncheckedCustom = customItems.filter(i => !i.isChecked);

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div style={{ backgroundColor: '#FFF3EB', minHeight: '100vh', paddingBottom: 90 }}>
      {/* Header with Logo + Account */}
      <AppHeader
        title="Einkaufsliste"
        rightAction={items.length > 0 ? (
          <button onClick={() => { if (confirm("Gesamte Einkaufsliste leeren?")) clearList(); }} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
          </button>
        ) : undefined}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '16px 20px 0' }}>
        <TabBtn active={viewMode === "kategorie"} onClick={() => setViewMode("kategorie")}>Nach Kategorie</TabBtn>
        <TabBtn active={viewMode === "rezepte"} onClick={() => setViewMode("rezepte")} badge={recipeGroups.length > 0 ? recipeGroups.length : undefined}>Nach Rezepten</TabBtn>
      </div>
      <div style={{ height: 2, backgroundColor: '#F2894F', margin: '0 20px', maxWidth: viewMode === "kategorie" ? '50%' : '50%', marginLeft: viewMode === "kategorie" ? 20 : 'auto', marginRight: viewMode === "kategorie" ? 'auto' : 20, transition: 'all 0.2s' }} />

      {/* Content */}
      <div style={{ padding: '0 0' }}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : viewMode === "kategorie" ? (
          <>
            {categories.map((cat) => {
              const collapsed = collapsedSections.has(cat.category);
              return (
                <Section key={cat.category} title={cat.label} collapsed={collapsed} onToggle={() => toggleSection(cat.category)}>
                  {cat.items.map((item) => (
                    <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} onEdit={() => setEditItem(item)} onDelete={() => deleteItem(item.id)} onUpdate={(u) => updateItem(item.id, u)} />
                  ))}
                </Section>
              );
            })}

            {uncheckedCustom.length > 0 && (
              <Section title="Weitere Einkäufe" collapsed={collapsedSections.has("custom")} onToggle={() => toggleSection("custom")}>
                {uncheckedCustom.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} onEdit={() => setEditItem(item)} onDelete={() => deleteItem(item.id)} onUpdate={(u) => updateItem(item.id, u)} />
                ))}
              </Section>
            )}

            {checkedItems.length > 0 && (
              <Section title="Bereits vorhandene Artikel" collapsed={collapsedSections.has("checked")} onToggle={() => toggleSection("checked")}>
                {checkedItems.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} onEdit={() => setEditItem(item)} onDelete={() => deleteItem(item.id)} onUpdate={(u) => updateItem(item.id, u)} />
                ))}
              </Section>
            )}
          </>
        ) : (
          <>
            {recipeGroups.map((group) => {
              const collapsed = collapsedSections.has(`recipe-${group.recipeId}`);
              return (
                <Section
                  key={group.recipeId}
                  title={group.recipeName}
                  subtitle={`${group.items.length} Zutaten`}
                  collapsed={collapsed}
                  onToggle={() => toggleSection(`recipe-${group.recipeId}`)}
                  headerRight={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Stepper: -1 / count / +1 */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 0,
                        backgroundColor: '#FDE8E0', borderRadius: 10,
                        overflow: 'hidden',
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (group.batchCount <= 1) {
                              if (confirm(`"${group.recipeName}" aus der Einkaufsliste entfernen?`)) {
                                removeAllRecipeItems(group.recipeId);
                              }
                            } else {
                              removeRecipeBatch(group.recipeId);
                            }
                          }}
                          style={{
                            width: 32, height: 32, border: 'none', backgroundColor: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0,
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
                        </button>
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: '#F2894F',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          minWidth: 24, textAlign: 'center',
                        }}>
                          {group.batchCount}×
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addRecipeBatch(group.recipeId);
                          }}
                          style={{
                            width: 32, height: 32, border: 'none', backgroundColor: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0,
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </button>
                      </div>

                      {/* Trash: ganzes Rezept löschen */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${group.recipeName}" komplett aus der Einkaufsliste entfernen?`)) {
                            removeAllRecipeItems(group.recipeId);
                          }
                        }}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          backgroundColor: 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0, flexShrink: 0,
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  }
                >
                  {group.items.map((item) => (
                    <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} onEdit={() => setEditItem(item)} onDelete={() => deleteItem(item.id)} onUpdate={(u) => updateItem(item.id, u)} />
                  ))}
                </Section>
              );
            })}

            {checkedItems.length > 0 && (
              <Section title="Bereits vorhandene Artikel" collapsed={collapsedSections.has("checked-r")} onToggle={() => toggleSection("checked-r")}>
                {checkedItems.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} onEdit={() => setEditItem(item)} onDelete={() => deleteItem(item.id)} onUpdate={(u) => updateItem(item.id, u)} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'fixed', bottom: 100, right: 20, width: 56, height: 56, borderRadius: '50%',
          backgroundColor: '#F2894F', color: 'white', border: 'none',
          boxShadow: '0 4px 16px rgba(242,137,79,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 40, cursor: 'pointer',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      </button>

      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onAdd={addCustomItem} />}
      {editItem && <EditItemModal item={editItem} onClose={() => setEditItem(null)} onSave={(updates) => { updateItem(editItem.id, updates); setEditItem(null); }} onDelete={() => { deleteItem(editItem.id); setEditItem(null); }} />}
    </div>
  );
}

// ============================================================
// Sub-Components
// ============================================================

function TabBtn({ active, onClick, badge, children }: { active: boolean; onClick: () => void; badge?: number; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, paddingBottom: 10, fontSize: 15, fontWeight: active ? 700 : 500,
      textAlign: 'center', position: 'relative',
      color: active ? '#F2894F' : '#9193A0', background: 'none', border: 'none',
      fontFamily: "'Montserrat', sans-serif", cursor: 'pointer',
    }}>
      {children}
      {badge !== undefined && badge > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: 6, width: 20, height: 20, borderRadius: '50%',
          backgroundColor: '#9193A0', color: 'white', fontSize: 10, fontWeight: 700,
          verticalAlign: 'middle',
        }}>{badge}</span>
      )}
    </button>
  );
}

/* Collapsible section — strong header for clear hierarchy */
function Section({ title, subtitle, collapsed, onToggle, headerRight, children }: {
  title: string; subtitle?: string; collapsed: boolean; onToggle: () => void; headerRight?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      {/* Section header — visually distinct from items */}
      <div
        style={{
          display: 'flex', alignItems: 'center', width: '100%',
          padding: '20px 20px 10px',
        }}
      >
        {/* Chevron + Titel — klickbar zum Auf/Zuklappen */}
        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flex: 1,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, textAlign: 'left',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="#F2894F" strokeWidth="2.5"
            style={{ flexShrink: 0, transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span style={{
            fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700,
            color: '#F2894F', textTransform: 'uppercase', letterSpacing: 1.2,
          }}>{title}</span>
          {subtitle && (
            <span style={{ fontSize: 11, color: '#9193A0', marginLeft: 4, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{subtitle}</span>
          )}
        </button>
        {/* Aktionen rechts — NICHT klickbar zum Aufklappen */}
        {headerRight && <div>{headerRight}</div>}
      </div>

      {/* Items */}
      {!collapsed && (
        <div>{children}</div>
      )}
    </div>
  );
}

/* Item row with swap + trash buttons */
function ItemRow({ item, onToggle, onEdit, onDelete, onUpdate }: {
  item: ShoppingItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate?: (updates: Partial<Pick<ShoppingItem, 'name' | 'quantity' | 'unit' | 'notes'>>) => void;
}) {
  const [showAlts, setShowAlts] = useState(false);
  const [altLoading, setAltLoading] = useState(false);
  const [alts, setAlts] = useState<{ name: string; ratio: string; note: string }[] | null>(null);
  const [swapped, setSwapped] = useState<string | null>(null);

  const qty = item.quantity && item.unit
    ? `${item.quantity} ${item.unit}`
    : item.quantity || item.unit || "";
  const detail = [qty, item.notes].filter(Boolean).join(" · ");

  const handleLoadAlts = async () => {
    if (showAlts) { setShowAlts(false); return; }
    setShowAlts(true);
    if (alts) return; // already loaded
    setAltLoading(true);
    try {
      const res = await fetch("/api/recipe/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient: item.name, recipeName: item.recipeName || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlts(data.alternatives || []);
    } catch {
      setAlts([]);
    } finally {
      setAltLoading(false);
    }
  };

  const handleSwap = (altName: string) => {
    if (onUpdate) {
      const originalName = item.name;
      onUpdate({ name: altName, notes: `Ersetzt: ${originalName}` });
      setSwapped(altName);
      setShowAlts(false);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 20px',
        gap: 10,
        backgroundColor: '#FFF3EB',
      }}>
        {/* Checkbox */}
        <button onClick={onToggle} style={{
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          border: item.isChecked ? 'none' : '2px solid #D0D0D0',
          backgroundColor: item.isChecked ? '#F2894F' : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, transition: 'all 0.15s',
        }}>
          {item.isChecked && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Name + detail */}
        <div onClick={onEdit} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <span style={{
            fontSize: 15, fontWeight: 600,
            color: item.isChecked ? '#B0B0B0' : '#1E1F28',
            textDecoration: item.isChecked ? 'line-through' : 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.3,
          }}>
            {item.name}
          </span>
          {(detail || swapped) && (
            <span style={{
              fontSize: 13, color: swapped ? '#7B2D7D' : (item.isChecked ? '#C0C0C0' : '#9193A0'),
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textDecoration: item.isChecked ? 'line-through' : 'none',
              display: 'block', lineHeight: 1.3, marginTop: 1,
              fontWeight: swapped ? 500 : 400,
            }}>
              {detail}
            </span>
          )}
        </div>

        {/* Swap button */}
        {!item.isChecked && (
          <button onClick={handleLoadAlts} style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            backgroundColor: showAlts ? '#F3E5F5' : 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showAlts ? "#7B2D7D" : "#C0C0C0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
          </button>
        )}

        {/* Trash button */}
        <button onClick={onDelete} style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          backgroundColor: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Alternatives dropdown */}
      {showAlts && (
        <div style={{ margin: '0 20px 8px', padding: '12px 14px', backgroundColor: '#FCF7F2', borderRadius: 12 }}>
          {altLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, border: '2px solid #E0D5CA', borderTopColor: '#7B2D7D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 12, color: '#9193A0' }}>Alternativen laden...</span>
            </div>
          ) : alts && alts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4B164C', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ersetzen durch:</span>
              {alts.map((alt, i) => (
                <button key={i} onClick={() => handleSwap(alt.name)} style={{
                  display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px',
                  backgroundColor: 'white', borderRadius: 10, border: '1px solid #E0D5CA',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#212022' }}>{alt.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#F2894F', fontWeight: 600 }}>{alt.ratio}</span>
                  {alt.note && (
                    <span style={{ fontSize: 11, color: '#9193A0', lineHeight: 1.4 }}>{alt.note}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#9193A0' }}>Keine Alternativen gefunden.</span>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}

function AddItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, quantity: string, unit: string) => void }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), quantity.trim(), unit.trim());
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    backgroundColor: '#FCF7F2', border: '2px solid transparent',
    outline: 'none', fontSize: 15, color: '#212022',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#462F4D', marginBottom: 20 }}>Artikel hinzufügen</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Artikelname *" autoFocus style={inputStyle} />
          <div style={{ display: 'flex', gap: 12 }}>
            <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Menge" style={{ ...inputStyle, flex: 1 }} />
            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="Einheit" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
        <button onClick={handleAdd} disabled={!name.trim()} style={{ width: '100%', padding: 16, borderRadius: 13, backgroundColor: !name.trim() ? '#E7DEC4' : '#F2894F', color: !name.trim() ? '#9193A0' : 'white', fontWeight: 600, fontSize: 16, border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed', marginBottom: 8 }}>
          Hinzufügen
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#9193A0', fontSize: 14, cursor: 'pointer' }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function EditItemModal({ item, onClose, onSave, onDelete }: { item: ShoppingItem; onClose: () => void; onSave: (updates: Partial<Pick<ShoppingItem, 'name' | 'quantity' | 'unit'>>) => void; onDelete: () => void }) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    backgroundColor: '#FCF7F2', border: '2px solid transparent',
    outline: 'none', fontSize: 15, color: '#212022',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#462F4D', marginBottom: 4 }}>Artikel bearbeiten</h3>
        {item.recipeName && <p style={{ fontSize: 12, color: '#9193A0', marginBottom: 16 }}>Aus: {item.recipeName}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={inputStyle} />
          <div style={{ display: 'flex', gap: 12 }}>
            <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Menge" style={{ ...inputStyle, flex: 1 }} />
            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="Einheit" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
        <button onClick={() => onSave({ name: name.trim(), quantity: quantity.trim(), unit: unit.trim() })} style={{ width: '100%', padding: 16, borderRadius: 13, backgroundColor: '#F2894F', color: 'white', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 8 }}>
          Speichern
        </button>
        <button onClick={onDelete} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#E64949', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 4 }}>
          Artikel löschen
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#9193A0', fontSize: 14, cursor: 'pointer' }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '20px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: 52, backgroundColor: '#FCF7F2', borderRadius: 8, marginBottom: 8, opacity: 0.6 }} />)}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#FEF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', marginBottom: 8 }}>Einkaufsliste ist leer</h3>
      <p style={{ fontSize: 14, color: '#9193A0', maxWidth: 260, margin: '0 auto' }}>Öffne ein Rezept und tippe auf &quot;Zutaten in die Einkaufsliste&quot;.</p>
    </div>
  );
}
