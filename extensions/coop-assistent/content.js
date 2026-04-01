// SnapShop Coop Assistent — Content Script
// Runs on coop.ch to show a floating shopping panel

(function () {
  "use strict";

  const STORAGE_KEY = "snapshop_coop_assistent";
  const PANEL_ID = "snapshop-coop-panel";

  // ─── 1. Init: Check for ingredients in URL hash or localStorage ───

  function getIngredients() {
    // First check URL hash (initial load from SnapShop)
    const hash = window.location.hash;
    if (hash.startsWith("#snapshop=")) {
      try {
        const encoded = hash.replace("#snapshop=", "");
        const json = decodeURIComponent(atob(encoded));
        const items = JSON.parse(json);
        // Save to localStorage for persistence across pages
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        // Clean hash from URL
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return items;
      } catch (e) {
        console.error("[SnapShop] Failed to parse hash data:", e);
      }
    }

    // Fallback: read from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  function saveIngredients(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function clearIngredients() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ─── 2. AI-optimized search term cleaning ───

  function cleanSearchTerm(name) {
    // Remove quantities, notes, and cleaning for optimal coop.ch search
    return name
      .replace(/\(.*?\)/g, "") // Remove parenthetical notes
      .replace(/,.*$/, "") // Remove everything after comma
      .replace(/\b(ca\.|ca|circa|etwa|evtl|optional|nach Belieben)\b.*/gi, "")
      .replace(/\b(frisch|frische|frischer|bio|Bio-)\b/gi, "") // Remove qualifiers
      .replace(/\b(in Tranchen|in Scheiben|in Würfel|gehackt|geschnitten|gerieben)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ─── 3. UI: Create the floating panel ───

  function createPanel(items) {
    // Remove existing panel if any
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id = PANEL_ID;

    const totalItems = items.length;
    const doneItems = items.filter((i) => i.done).length;

    panel.innerHTML = `
      <style>
        #${PANEL_ID} {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 340px;
          max-height: 70vh;
          background: #FFF3EB;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        #${PANEL_ID}.minimized {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          cursor: pointer;
          max-height: 56px;
        }
        #${PANEL_ID}.minimized .ss-panel-content { display: none; }
        #${PANEL_ID}.minimized .ss-panel-fab { display: flex; }
        .ss-panel-fab {
          display: none;
          width: 56px;
          height: 56px;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F2894F, #E06820);
          border-radius: 50%;
          cursor: pointer;
        }
        .ss-panel-header {
          background: linear-gradient(135deg, #F2894F, #E06820);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ss-panel-header h3 {
          color: white;
          font-size: 15px;
          font-weight: 700;
          margin: 0;
        }
        .ss-panel-header .ss-progress {
          color: rgba(255,255,255,0.85);
          font-size: 12px;
        }
        .ss-panel-header button {
          background: rgba(255,255,255,0.2);
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: white;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ss-panel-list {
          max-height: calc(70vh - 120px);
          overflow-y: auto;
          padding: 8px 12px;
        }
        .ss-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ss-item:hover { background: rgba(242,137,79,0.08); }
        .ss-item.done { opacity: 0.45; }
        .ss-item.done .ss-item-name { text-decoration: line-through; }
        .ss-item.active { background: rgba(242,137,79,0.12); }
        .ss-item-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #D4C9BF;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .ss-item.done .ss-item-check {
          background: #4CAF50;
          border-color: #4CAF50;
        }
        .ss-item-info { flex: 1; min-width: 0; }
        .ss-item-name {
          font-size: 13px;
          font-weight: 600;
          color: #1E1F28;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ss-item-qty {
          font-size: 11px;
          color: #9193A0;
          margin-top: 1px;
        }
        .ss-item-search {
          background: #F2894F;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .ss-item-search:hover { background: #E06820; }
        .ss-panel-footer {
          padding: 10px 12px;
          border-top: 1px solid #F0E8E1;
          display: flex;
          gap: 8px;
        }
        .ss-panel-footer button {
          flex: 1;
          padding: 8px;
          border-radius: 10px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .ss-btn-minimize {
          background: #F0E8E1;
          color: #9193A0;
        }
        .ss-btn-done {
          background: #4CAF50;
          color: white;
        }
      </style>

      <div class="ss-panel-fab" title="SnapShop Einkaufsliste">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      </div>

      <div class="ss-panel-content">
        <div class="ss-panel-header">
          <div>
            <h3>SnapShop Einkaufsliste</h3>
            <span class="ss-progress">${doneItems} von ${totalItems} erledigt</span>
          </div>
          <div style="display:flex;gap:6px">
            <button class="ss-btn-min" title="Minimieren">&#8211;</button>
            <button class="ss-btn-close" title="Beenden">&times;</button>
          </div>
        </div>

        <div class="ss-panel-list">
          ${items
            .map(
              (item, idx) => `
            <div class="ss-item ${item.done ? "done" : ""}" data-idx="${idx}">
              <div class="ss-item-check">
                ${item.done ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : ""}
              </div>
              <div class="ss-item-info">
                <div class="ss-item-name">${escapeHtml(item.name)}</div>
                <div class="ss-item-qty">${escapeHtml([item.quantity, item.unit].filter(Boolean).join(" "))}</div>
              </div>
              ${!item.done ? `<button class="ss-item-search" data-search="${escapeAttr(cleanSearchTerm(item.name))}">Suchen</button>` : ""}
            </div>
          `
            )
            .join("")}
        </div>

        <div class="ss-panel-footer">
          <button class="ss-btn-minimize">Minimieren</button>
          <button class="ss-btn-done">Fertig</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // ─── Event Handlers ───

    // Search button: navigate to coop search
    panel.querySelectorAll(".ss-item-search").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const term = btn.dataset.search;
        window.location.href = `/de/search/?text=${encodeURIComponent(term)}`;
      });
    });

    // Toggle done: click on item row
    panel.querySelectorAll(".ss-item").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest(".ss-item-search")) return;
        const idx = parseInt(row.dataset.idx);
        items[idx].done = !items[idx].done;
        saveIngredients(items);
        createPanel(items); // Re-render
      });
    });

    // Minimize
    panel.querySelectorAll(".ss-btn-min, .ss-btn-minimize").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.add("minimized");
      });
    });

    // Expand from FAB
    panel.querySelector(".ss-panel-fab").addEventListener("click", () => {
      panel.classList.remove("minimized");
    });

    // Close / Done
    panel.querySelector(".ss-btn-close").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Einkaufsliste beenden? (Fortschritt wird gelöscht)")) {
        clearIngredients();
        panel.remove();
      }
    });

    panel.querySelector(".ss-btn-done").addEventListener("click", () => {
      clearIngredients();
      panel.remove();
      // Optional: show success message
      const toast = document.createElement("div");
      toast.style.cssText =
        "position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;padding:16px 24px;border-radius:14px;font-weight:600;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.15)";
      toast.textContent = "Einkauf erledigt!";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    });

    // Auto-highlight current search term if on search results page
    highlightCurrentSearch(items);
  }

  // ─── 4. Highlight matching product on search results ───

  function highlightCurrentSearch(items) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchText = urlParams.get("text");
    if (!searchText) return;

    // Find the matching ingredient
    const matchIdx = items.findIndex(
      (item) =>
        !item.done &&
        cleanSearchTerm(item.name).toLowerCase() === searchText.toLowerCase()
    );

    if (matchIdx >= 0) {
      // Highlight the active item in the panel
      const row = document.querySelector(`.ss-item[data-idx="${matchIdx}"]`);
      if (row) row.classList.add("active");

      // Try to find the best matching product tile on the page
      setTimeout(() => {
        const tiles = document.querySelectorAll(".productTile");
        if (tiles.length > 0) {
          // Scroll to first product tile and add a subtle highlight
          tiles[0].scrollIntoView({ behavior: "smooth", block: "center" });
          tiles[0].style.outline = "3px solid #F2894F";
          tiles[0].style.outlineOffset = "2px";
          tiles[0].style.borderRadius = "12px";
        }
      }, 1000); // Wait for page to fully render
    }
  }

  // ─── Helpers ───

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    if (!str) return "";
    return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ─── 5. Main: Initialize ───

  const items = getIngredients();
  if (items && items.length > 0) {
    createPanel(items);
  }
})();
