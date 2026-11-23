// Dodecahedron page: the "Try it" demo (#try). A mock of the app that simulates mystery orders from made-up data,
// entirely in the browser. Two tabs: an item pool with pick methods, and a slot-by-slot apparel bundle.
// The rules follow the setup guide: /dodecahedron/help/#bundles, #slots and #pick-methods.
(() => {
  const root = document.querySelector("[data-dd-try]");
  if (!root) return;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const money = (n) => "$" + n.toFixed(2);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // Random pick, weighted: items with more stock come up more often.
  const weighted = (list, weight) => {
    let r = Math.random() * list.reduce((s, x) => s + weight(x), 0);
    for (const x of list) if ((r -= weight(x)) < 0) return x;
    return list[list.length - 1];
  };
  let orderNo = 1041;

  // Re-render a panel and keep keyboard focus on the same control (controls carry a data-k key).
  const paint = (el, html) => {
    const active = document.activeElement;
    const key = active && el.contains(active) ? active.dataset.k : null;
    el.innerHTML = html;
    if (!key) return;
    const again = el.querySelector(`[data-k="${key}"]`);
    (again && !again.disabled ? again : el.querySelector('[data-k="reset"]'))?.focus();
  };

  // The two cards every simulated order ends with: what the shopper sees, and what the team packs.
  const orderHtml = (o) => `
    <div class="dd-split${o.fresh ? " is-fresh" : ""}">
      <div class="dd-split-card">
        <span class="dd-split-label">Shopper sees</span>
        <b>${o.no}</b>
        <p>${esc(o.product)} × 1</p>
        <p class="dd-split-sealed">Contents sealed</p>
      </div>
      <span class="dd-split-arrow" aria-hidden="true">→</span>
      <div class="dd-split-card">
        <span class="dd-split-label">Your team or 3PL packs</span>
        <b>${o.no}-mystery</b>
        <ul class="dd-ship-list">${o.lines.map((l) => `<li>${l.slot ? `<b>${esc(l.slot)}</b>` : ""}<span>${esc(l.name)}</span></li>`).join("")}</ul>
      </div>
    </div>`;
  const emptyHtml = (text) => `<p class="dd-try-empty">${text}</p>`;
  const footHtml = (left, units) => `
    <div class="dd-try-foot">
      <span>${left}</span>
      <span><b>${units}</b> ${units === 1 ? "unit" : "units"} cleared</span>
      <button type="button" class="dd-link-btn" data-k="reset" data-reset>Reset</button>
    </div>`;

  /* ---------- Item pool ---------- */

  const POOL = [
    { id: "beanie", name: "Wool beanie, mustard", stock: 6, weekly: 0.1, lastSold: 270, price: 28, cost: 9 },
    { id: "tote", name: "Canvas tote, sage", stock: 5, weekly: 0.15, lastSold: 120, price: 24, cost: 6 },
    { id: "candle", name: "Pine candle, 8 oz", stock: 4, weekly: 0.2, lastSold: 300, price: 22, cost: 5 },
    { id: "mug", name: "Enamel mug, coral", stock: 4, weekly: 0.3, lastSold: 60, price: 18, cost: 7 },
    { id: "grip", name: "Phone grip, glitter", stock: 3, weekly: 0.25, lastSold: 480, price: 12, cost: 2 },
    { id: "stickers", name: "Sticker pack", stock: 8, weekly: 2, lastSold: 5, price: 8, cost: 1.5 },
  ];
  const margin = (p) => p.price - p.cost;
  // score: higher ships first. Weeks of supply uses the day's starting stock: sales figures update once a day.
  const METHODS = {
    slowest: { name: "Slowest sellers first", hint: "The most weeks of supply (stock ÷ weekly sales) ships first, until it runs out.",
      score: (p) => p.start / p.weekly, label: (p) => `${Math.round(p.start / p.weekly)} wks of supply` },
    unsold: { name: "Longest unsold first", hint: "The item whose last sale was longest ago ships first, until it runs out.",
      score: (p) => p.lastSold, label: (p) => (p.lastSold >= 60 ? `last sold ${Math.round(p.lastSold / 30)} mo ago` : `last sold ${p.lastSold} days ago`) },
    marginHigh: { name: "Highest margin first", hint: "Retail price minus unit cost: the biggest margin ships first, until it runs out.",
      score: margin, label: (p) => `${money(margin(p))} margin` },
  };

  const pool = { method: "slowest", perBox: 1 };
  const resetPool = () => {
    pool.items = POOL.map((p) => ({ ...p, start: p.stock, on: true }));
    pool.last = null;
    pool.units = 0;
    pool.shipped = new Set();
  };

  const poolPanel = document.getElementById("try-panel-pool");
  const renderPool = () => {
    const m = METHODS[pool.method];
    const avail = pool.items.filter((p) => p.on && p.stock > 0);
    const total = avail.reduce((s, p) => s + p.stock, 0);
    const ranked = avail.slice().sort((a, b) => m.score(b) - m.score(a));
    const scores = ranked.map(m.score);
    const hi = Math.max(...scores), lo = Math.min(...scores);
    const boxes = Math.floor(total / pool.perBox);
    const row = (p, rank) => {
      const w = rank ? 15 + (85 * (m.score(p) - lo)) / (hi - lo || 1) : 0;
      const mark = rank || "–";
      const info = (rank ? m.label(p) + " · " : "") + (p.stock ? `${p.stock} left` : "sold out");
      return `<li data-rank="${mark}" class="${rank ? "" : "is-out"}${pool.shipped.has(p.id) ? " is-shipped" : ""}">
        <label><input type="checkbox" data-k="on-${p.id}" data-on="${p.id}"${p.on ? " checked" : ""}><span>${esc(p.name)}</span></label>
        <small>${info}</small>
        <span class="dd-bar" style="--w: ${w}%"></span>
      </li>`;
    };
    paint(poolPanel, `
      <div class="dd-try-grid">
        <div class="dd-try-setup">
          <label class="dd-select"><span>Pick method</span>
            <select data-k="method" data-method>${Object.entries(METHODS).map(([k, v]) =>
              `<option value="${k}"${k === pool.method ? " selected" : ""}>${v.name}</option>`).join("")}</select>
          </label>
          <p class="dd-try-hint">${m.hint}</p>
          <div class="dd-row-ctl"><span>Items per box</span>
            <div class="dd-seg" role="group" aria-label="Items per box">${[1, 2, 3].map((n) =>
              `<button type="button" data-k="per-${n}" data-per="${n}" aria-pressed="${n === pool.perBox}">${n}</button>`).join("")}</div>
          </div>
          <ol class="dd-rank dd-rank-pool" aria-label="Pool, in the order items ship">${ranked.map((p, i) => row(p, i + 1)).join("")}${pool.items.filter((p) => !avail.includes(p)).map((p) => row(p, 0)).join("")}</ol>
        </div>
        <div class="dd-try-out">
          <button type="button" class="dd-btn dd-btn-primary" data-k="sim" data-sim${boxes ? "" : " disabled"}>${boxes ? "Simulate an order" : "Pool is empty"}</button>
          <div aria-live="polite">${pool.last ? orderHtml(pool.last) : emptyHtml(boxes
            ? "Press <b>Simulate an order</b> to see what the shopper buys and what your team packs."
            : "Tick a few more items to put stock back in the pool.")}</div>
          ${footHtml(`<b>${boxes}</b> ${boxes === 1 ? "box" : "boxes"} left`, pool.units)}
        </div>
      </div>`);
    if (pool.last) pool.last.fresh = false;
    pool.shipped.clear();
  };

  // One box: perBox items, different products while stock allows (repeats only when the pool runs short).
  const simulatePool = () => {
    const m = METHODS[pool.method];
    const taken = new Map();
    const left = (p) => p.stock - (taken.get(p.id) || 0);
    const picks = [];
    for (let k = 0; k < pool.perBox; k++) {
      const open = pool.items.filter((p) => p.on && left(p) > 0);
      if (!open.length) break;
      const fresh = open.filter((p) => !taken.has(p.id));
      const choices = fresh.length ? fresh : open;
      const pick = choices.sort((a, b) => m.score(b) - m.score(a))[0];
      taken.set(pick.id, (taken.get(pick.id) || 0) + 1);
      picks.push(pick);
    }
    if (picks.length < pool.perBox) return;
    picks.forEach((p) => { p.stock--; pool.shipped.add(p.id); });
    pool.units += picks.length;
    pool.last = {
      no: "#" + ++orderNo, fresh: true,
      product: pool.perBox === 1 ? "The Surprise Pack" : `The Surprise Pack (${pool.perBox} items)`,
      lines: picks.map((p) => ({ name: p.name })),
    };
    renderPool();
  };

  poolPanel.addEventListener("change", (e) => {
    if (e.target.matches("[data-method]")) pool.method = e.target.value;
    else if (e.target.matches("[data-on]")) pool.items.find((p) => p.id === e.target.dataset.on).on = e.target.checked;
    else return;
    renderPool();
  });
  poolPanel.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.per) { pool.perBox = +b.dataset.per; renderPool(); }
    else if (b.hasAttribute("data-sim")) simulatePool();
    else if (b.hasAttribute("data-reset")) { resetPool(); renderPool(); }
  });

  /* ---------- Slot by slot ---------- */

  const SIZES = ["S", "M", "L"];
  const SLOTS = [
    { name: "Shirt", ask: "Shirt size", items: [
      { id: "logo", name: "Logo tee, black", sizes: { S: 2, M: 3, L: 1 } },
      { id: "pocket", name: "Pocket tee, olive", sizes: { S: 1, M: 2, L: 2 } },
      { id: "ringer", name: "Ringer tee, cream", sizes: { S: 2, M: 1, L: 0 } },
    ] },
    { name: "Accessory", items: [
      { id: "beanie", name: "Wool beanie", stock: 4 },
      { id: "cap", name: "Dad cap", stock: 3 },
      { id: "socks", name: "Crew socks", stock: 5 },
      { id: "bandana", name: "Bandana", stock: 2 },
    ] },
    { name: "Random item", items: [
      { id: "mug", name: "Enamel mug", stock: 3 },
      { id: "stickers", name: "Sticker pack", stock: 6 },
      { id: "candle", name: "Pine candle", stock: 2 },
      { id: "keychain", name: "Keychain", stock: 4 },
      { id: "tote", name: "Canvas tote", stock: 2 },
    ] },
  ];

  const look = { size: "M" };
  const resetSlots = () => {
    const names = look.slots ? look.slots.map((s) => s.name) : null; // keep any renamed slots
    look.slots = SLOTS.map((s, i) => ({ ...s, name: names ? names[i] : s.name,
      items: s.items.map((it) => ({ ...it, sizes: it.sizes && { ...it.sizes }, on: true })) }));
    look.last = null;
    look.units = 0;
    look.shipped = new Set();
  };
  const units = (it, size) => (it.sizes ? it.sizes[size] : it.stock);
  const slotStock = (s, size) => s.items.reduce((n, it) => n + (it.on ? units(it, size) : 0), 0);
  // A box sells only when every slot can fill it.
  const boxesFor = (size) => Math.min(...look.slots.map((s) => slotStock(s, size)));

  const slotsPanel = document.getElementById("try-panel-slots");
  const renderSlots = () => {
    const boxes = boxesFor(look.size);
    const asker = look.slots.find((s) => s.ask);
    paint(slotsPanel, `
      <div class="dd-try-grid">
        <div class="dd-slots">${look.slots.map((s, i) => `
          <div class="dd-slot">
            <div class="dd-slot-head">
              <span class="dd-slot-num">${i + 1}</span>
              <input class="dd-slot-name" data-k="name-${i}" data-name="${i}" value="${esc(s.name)}" maxlength="20" aria-label="Slot ${i + 1} name" spellcheck="false">
              <span class="dd-badge${s.ask ? "" : " dd-badge-plain"}">${s.ask ? `Shoppers choose: ${esc(s.ask)}` : "Any item"}</span>
            </div>
            <div class="dd-chips" role="group" aria-label="Slot ${i + 1} pool">${s.items.map((it) => `
              <button type="button" class="dd-chip-btn${look.shipped.has(i + ":" + it.id) ? " is-shipped" : ""}" data-k="item-${i}-${it.id}" data-item="${i}:${it.id}" aria-pressed="${it.on}">
                ${esc(it.name)} <small>${it.sizes ? SIZES.map((z) => z + " " + it.sizes[z]).join(" · ") : "× " + it.stock}</small>
              </button>`).join("")}
            </div>
            <p class="dd-slot-foot">${s.ask ? `${slotStock(s, look.size)} in size ${look.size}` : `${slotStock(s, look.size)} in the pool`}</p>
          </div>`).join("")}
        </div>
        <div class="dd-try-out">
          <div class="dd-row-ctl"><span>Shopper picks ${esc((asker ? asker.ask : "size").toLowerCase())}</span>
            <div class="dd-seg dd-seg-sizes" role="group" aria-label="${esc(asker ? asker.ask : "Size")}">${SIZES.map((z) => `
              <button type="button" data-k="size-${z}" data-size="${z}" aria-pressed="${z === look.size}">${z}<small>${plural(boxesFor(z), "box", "boxes")}</small></button>`).join("")}
            </div>
          </div>
          <button type="button" class="dd-btn dd-btn-primary" data-k="sim" data-sim${boxes ? "" : " disabled"}>${boxes ? `Simulate an order (size ${look.size})` : `Size ${look.size} is sold out`}</button>
          <div aria-live="polite">${look.last ? orderHtml(look.last) : emptyHtml(boxes
            ? "Every box gets one item from each slot. Toggle items in a slot's pool, pick a size, then simulate."
            : "A box sells only when every slot can fill it. Add items back, or try another size.")}</div>
          ${footHtml(`<b>${plural(boxes, "box", "boxes")}</b> left in ${look.size}`, look.units)}
        </div>
      </div>`);
    if (look.last) look.last.fresh = false;
    look.shipped.clear();
  };

  const simulateSlots = () => {
    const size = look.size;
    if (!boxesFor(size)) return;
    const lines = look.slots.map((s, i) => {
      const it = weighted(s.items.filter((x) => x.on && units(x, size) > 0), (x) => units(x, size));
      if (it.sizes) it.sizes[size]--; else it.stock--;
      look.shipped.add(i + ":" + it.id);
      return { slot: s.name, name: it.sizes ? `${it.name} · ${size}` : it.name };
    });
    look.units += lines.length;
    look.last = { no: "#" + ++orderNo, fresh: true, product: `The Mystery Look · size ${size}`, lines };
    renderSlots();
  };

  slotsPanel.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.item) {
      const [i, id] = b.dataset.item.split(":");
      const it = look.slots[i].items.find((x) => x.id === id);
      it.on = !it.on;
      renderSlots();
    } else if (b.dataset.size) { look.size = b.dataset.size; renderSlots(); }
    else if (b.hasAttribute("data-sim")) simulateSlots();
    else if (b.hasAttribute("data-reset")) { resetSlots(); renderSlots(); }
  });
  // Renaming a slot just updates the name (no re-render, so typing isn't interrupted).
  slotsPanel.addEventListener("input", (e) => {
    if (e.target.matches("[data-name]")) look.slots[e.target.dataset.name].name = e.target.value.trim() || `Slot ${+e.target.dataset.name + 1}`;
  });

  /* ---------- Tabs (ARIA tabs pattern: arrow keys, Home and End move between tabs) ---------- */

  const list = root.querySelector(".dd-tabs");
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  const select = (i, focus) => {
    tabs.forEach((t, j) => {
      t.setAttribute("aria-selected", i === j);
      t.tabIndex = i === j ? 0 : -1;
      panels[j].hidden = i !== j;
    });
    if (focus) tabs[i].focus();
  };
  list.addEventListener("click", (e) => {
    const i = tabs.indexOf(e.target.closest('[role="tab"]'));
    if (i >= 0) select(i, false);
  });
  list.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    const n = tabs.length;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    select(next % n, true);
  });

  resetPool();
  resetSlots();
  renderPool();
  renderSlots();
  list.hidden = false;
  select(0, false);
})();
