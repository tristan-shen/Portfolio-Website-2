/* =========================================
   Portfolio Risk Dashboard (Demo)
   - Generates sample/random holdings
   - Computes allocation + concentration + flags
   - Draws donut chart on canvas (no libraries)
   - Produces rebalance suggestions vs targets
   ========================================= */

const COLORS = {
  Equity: "#1f6fff",
  Bond: "#00c2a8",
  Cash: "#7a7f8a",
  Alt: "#a96bff"
};

const DEFAULT_TARGETS = {
  Equity: 60,
  Bond: 30,
  Cash: 5,
  Alt: 5
};

let state = {
  holdings: [],
  targets: { ...DEFAULT_TARGETS }
};

// ---------- Utilities ----------
const fmtMoney = (x) => {
  const abs = Math.abs(x);
  const cents = abs < 1000 ? 2 : 0;
  return x.toLocaleString(undefined, { minimumFractionDigits: cents, maximumFractionDigits: cents });
};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function computeValue(h) {
  return h.shares * h.price;
}

function sum(arr) {
  return arr.reduce((a,b) => a + b, 0);
}

function todayStr() {
  return new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

// ---------- Sample data ----------
function loadSample() {
  state.holdings = [
    { ticker:"TSLA", name:"Tesla", assetClass:"Equity", sector:"Consumer Discretionary", shares: 18, price: 215.30, riskScore: 8 },
    { ticker:"AAPL", name:"Apple", assetClass:"Equity", sector:"Technology", shares: 35, price: 189.20, riskScore: 4 },
    { ticker:"NVDA", name:"NVIDIA", assetClass:"Equity", sector:"Technology", shares: 10, price: 720.80, riskScore: 7 },
    { ticker:"JPM", name:"JPMorgan", assetClass:"Equity", sector:"Financials", shares: 30, price: 175.10, riskScore: 4 },
    { ticker:"XIU", name:"iShares TSX 60", assetClass:"Equity", sector:"Index", shares: 60, price: 33.40, riskScore: 3 },

    { ticker:"ZAG", name:"Aggregate Bond ETF", assetClass:"Bond", sector:"Fixed Income", shares: 180, price: 13.10, riskScore: 2 },
    { ticker:"HYG", name:"High Yield Bond ETF", assetClass:"Bond", sector:"Fixed Income", shares: 40, price: 76.30, riskScore: 5 },

    { ticker:"CASH", name:"High-Interest Cash", assetClass:"Cash", sector:"Cash", shares: 1, price: 12500, riskScore: 1 },

    { ticker:"GLD", name:"Gold ETF", assetClass:"Alt", sector:"Commodities", shares: 20, price: 185.70, riskScore: 3 }
  ];
  renderAll();
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomPortfolio() {
  const equityPool = [
    ["MSFT","Microsoft","Technology",4],
    ["GOOGL","Alphabet","Communication Services",4],
    ["AMZN","Amazon","Consumer Discretionary",6],
    ["TSLA","Tesla","Consumer Discretionary",8],
    ["JPM","JPMorgan","Financials",4],
    ["V","Visa","Financials",4],
    ["UNH","UnitedHealth","Health Care",3],
    ["COST","Costco","Consumer Staples",3],
    ["NVDA","NVIDIA","Technology",7],
    ["ENB","Enbridge","Energy",3],
    ["BNS","Scotiabank","Financials",3],
    ["SHOP","Shopify","Technology",7],
    ["XIU","iShares TSX 60","Index",3],
  ];

  const bondPool = [
    ["ZAG","Aggregate Bond ETF","Fixed Income",2],
    ["TLT","Long Treasury ETF","Fixed Income",3],
    ["HYG","High Yield Bond ETF","Fixed Income",5],
    ["IGSB","Short Corp Bond ETF","Fixed Income",2],
  ];

  const altPool = [
    ["GLD","Gold ETF","Commodities",3],
    ["SLV","Silver ETF","Commodities",4],
    ["VNQ","REIT ETF","Real Estate",4],
    ["BTC","Bitcoin (Demo)","Crypto",9],
  ];

  const cashPool = [["CASH","Cash / HISA","Cash",1]];

  // Make a plausible portfolio size
  const totalTarget = 350000 + Math.random() * 350000; // 350k - 700k

  // Choose holdings
  const equities = Array.from({ length: 6 }, () => randomChoice(equityPool));
  const bonds = Array.from({ length: 2 }, () => randomChoice(bondPool));
  const alts = Array.from({ length: 1 }, () => randomChoice(altPool));

  // Remove duplicates by ticker
  const uniq = (arr) => {
    const m = new Map();
    for (const x of arr) m.set(x[0], x);
    return Array.from(m.values());
  };

  const chosen = [
    ...uniq(equities).map(([t,n,s,r]) => ({ ticker:t, name:n, assetClass:"Equity", sector:s, riskScore:r })),
    ...uniq(bonds).map(([t,n,s,r]) => ({ ticker:t, name:n, assetClass:"Bond", sector:s, riskScore:r })),
    ...uniq(alts).map(([t,n,s,r]) => ({ ticker:t, name:n, assetClass:"Alt", sector:s, riskScore:r })),
    { ticker: cashPool[0][0], name: cashPool[0][1], assetClass:"Cash", sector:"Cash", riskScore: cashPool[0][3] }
  ];

  // Assign prices and shares to hit totalTarget with approx target weights
  const targets = state.targets;
  const buckets = { Equity: [], Bond: [], Alt: [], Cash: [] };
  for (const h of chosen) buckets[h.assetClass].push(h);

  // target dollars per class
  const dollars = {
    Equity: totalTarget * (targets.Equity/100),
    Bond: totalTarget * (targets.Bond/100),
    Cash: totalTarget * (targets.Cash/100),
    Alt: totalTarget * (targets.Alt/100)
  };

  // helper: distribute a bucket across its holdings
  function allocateBucket(list, total, priceRange) {
    if (!list.length) return;
    const weights = list.map(() => 0.6 + Math.random()); // 0.6-1.6
    const wsum = sum(weights);
    list.forEach((h, i) => {
      const w = weights[i] / wsum;
      const price = priceRange[0] + Math.random() * (priceRange[1]-priceRange[0]);
      const value = total * w;
      const shares = Math.max(1, Math.round(value / price));
      h.price = Math.round(price * 100) / 100;
      h.shares = shares;
    });
  }

  allocateBucket(buckets.Equity, dollars.Equity, [40, 450]);
  allocateBucket(buckets.Bond, dollars.Bond, [10, 120]);
  allocateBucket(buckets.Alt, dollars.Alt, [20, 300]);

  // cash = one line
  if (buckets.Cash.length) {
    buckets.Cash[0].price = Math.round(dollars.Cash);
    buckets.Cash[0].shares = 1;
  }

  state.holdings = chosen;
  renderAll();
}

// ---------- Calculations ----------
function portfolioTotal(holdings) {
  return sum(holdings.map(computeValue));
}

function weightsByAssetClass(holdings) {
  const total = portfolioTotal(holdings);
  const out = { Equity: 0, Bond: 0, Cash: 0, Alt: 0 };
  for (const h of holdings) out[h.assetClass] = (out[h.assetClass] || 0) + computeValue(h);
  const pct = {};
  for (const k of Object.keys(out)) pct[k] = total === 0 ? 0 : (out[k] / total) * 100;
  return { dollars: out, pct, total };
}

function topHoldingPct(holdings) {
  const total = portfolioTotal(holdings);
  const sorted = [...holdings].sort((a,b) => computeValue(b) - computeValue(a));
  const top = sorted[0];
  const pct = total === 0 ? 0 : (computeValue(top) / total) * 100;
  return { top, pct };
}

function sectorConcentration(holdings) {
  const total = portfolioTotal(holdings);
  const m = new Map();
  for (const h of holdings) {
    const v = computeValue(h);
    m.set(h.sector, (m.get(h.sector) || 0) + v);
  }
  let best = { sector: "—", value: 0, pct: 0 };
  for (const [sector, value] of m.entries()) {
    const pct = total === 0 ? 0 : (value / total) * 100;
    if (pct > best.pct) best = { sector, value, pct };
  }
  return best;
}

function riskProxy(holdings) {
  // weighted-average riskScore (demo, not real vol)
  const total = portfolioTotal(holdings);
  if (total === 0) return 0;
  let wsum = 0;
  for (const h of holdings) wsum += (computeValue(h) / total) * (h.riskScore || 0);
  return wsum; // 1-10-ish
}

function rebalanceSuggestions(holdings, targetsPct) {
  const { dollars, total } = weightsByAssetClass(holdings);

  // ideal dollars by class
  const ideal = {};
  for (const k of Object.keys(targetsPct)) ideal[k] = total * (targetsPct[k] / 100);

  // difference: ideal - current
  // positive = buy, negative = sell
  const diff = {};
  for (const k of Object.keys(ideal)) diff[k] = ideal[k] - (dollars[k] || 0);

  return { total, current: dollars, ideal, diff };
}

// ---------- UI Rendering ----------
function renderTargetsBox() {
  const el = document.getElementById("targets");
  if (!el) return;

  el.innerHTML = Object.keys(state.targets).map(k => `
    <div class="target">
      <div class="target__k">${k}</div>
      <div class="target__v">${state.targets[k].toFixed(0)}%</div>
    </div>
  `).join("");
}

function renderTargetForm() {
  const el = document.getElementById("targetForm");
  if (!el) return;

  const keys = Object.keys(state.targets);
  el.innerHTML = keys.map(k => `
    <div class="tfRow">
      <label for="t_${k}">${k}</label>
      <input id="t_${k}" type="number" min="0" max="100" step="1" value="${state.targets[k]}" />
    </div>
  `).join("");

  // bind change
  keys.forEach(k => {
    const input = document.getElementById(`t_${k}`);
    input.addEventListener("input", () => {
      const v = Number(input.value);
      state.targets[k] = clamp(isFinite(v) ? v : 0, 0, 100);

      // optional: normalize to 100
      const total = sum(keys.map(x => state.targets[x]));
      if (total > 0) {
        // Normalize gently so UI stays sane
        keys.forEach(x => state.targets[x] = (state.targets[x] / total) * 100);
      }

      renderTargetsBox();
      renderRebalance();
      renderRiskBadges();
      renderMetrics();
      drawDonut();
    });
  });
}

function renderHeaderTotals() {
  const total = portfolioTotal(state.holdings);
  const totalEl = document.getElementById("totalValue");
  const asOf = document.getElementById("asOf");
  if (totalEl) totalEl.textContent = `$${fmtMoney(total)}`;
  if (asOf) asOf.textContent = `As of ${todayStr()} • ${state.holdings.length} holdings`;
}

function renderRiskBadges() {
  const el = document.getElementById("riskBadges");
  if (!el) return;

  const { pct: alloc } = weightsByAssetClass(state.holdings);
  const top = topHoldingPct(state.holdings);
  const sec = sectorConcentration(state.holdings);

  const equityTarget = state.targets.Equity ?? 0;
  const equityOver = alloc.Equity - equityTarget;

  // thresholds (demo)
  const topFlag = top.pct >= 20 ? "bad" : top.pct >= 12 ? "warn" : "good";
  const sectorFlag = sec.pct >= 35 ? "bad" : sec.pct >= 22 ? "warn" : "good";
  const equityFlag = equityOver >= 10 ? "warn" : equityOver <= -10 ? "warn" : "good";

  const badges = [
    { label: `Top holding: ${top.pct.toFixed(1)}%`, level: topFlag },
    { label: `Top sector: ${sec.sector} (${sec.pct.toFixed(1)}%)`, level: sectorFlag },
    { label: `Equity vs target: ${equityOver >= 0 ? "+" : ""}${equityOver.toFixed(1)}%`, level: equityFlag },
  ];

  el.innerHTML = badges.map(b => `
    <span class="badge badge--${b.level}">${b.label}</span>
  `).join("");
}

function renderMetrics() {
  const el = document.getElementById("metrics");
  if (!el) return;

  const { pct: alloc } = weightsByAssetClass(state.holdings);
  const top = topHoldingPct(state.holdings);
  const sec = sectorConcentration(state.holdings);
  const rp = riskProxy(state.holdings);

  const equityTarget = state.targets.Equity ?? 0;
  const equityOver = alloc.Equity - equityTarget;

  const items = [
    { k: "Top holding", v: `${top.top?.ticker || "—"} • ${top.pct.toFixed(1)}%`, note: "Concentration risk" },
    { k: "Top sector", v: `${sec.sector} • ${sec.pct.toFixed(1)}%`, note: "Sector concentration" },
    { k: "Equity weight", v: `${alloc.Equity.toFixed(1)}%`, note: `Target ${equityTarget.toFixed(0)}% (${equityOver>=0?"+":""}${equityOver.toFixed(1)}%)` },
    { k: "Risk proxy", v: `${rp.toFixed(2)} / 10`, note: "Weighted risk score (demo)" },
  ];

  el.innerHTML = items.map(x => `
    <div class="metric">
      <div class="metric__k">${x.k}</div>
      <div class="metric__v">${x.v}</div>
      <div class="metric__note">${x.note}</div>
    </div>
  `).join("");
}

function renderAllocationLegend() {
  const el = document.getElementById("allocLegend");
  if (!el) return;
  const { pct } = weightsByAssetClass(state.holdings);

  const rows = Object.keys(pct).map(k => ({
    k,
    color: COLORS[k] || "#999",
    v: pct[k]
  }));

  el.innerHTML = rows.map(r => `
    <div class="legRow">
      <div class="legLeft">
        <span class="swatch" style="background:${r.color}"></span>
        <span class="legName">${r.k}</span>
      </div>
      <div class="legVal">${r.v.toFixed(1)}%</div>
    </div>
  `).join("");
}

function drawDonut() {
  const canvas = document.getElementById("donut");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const size = 260;
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const { pct, total } = weightsByAssetClass(state.holdings);
  const entries = Object.keys(pct).map(k => ({ k, pct: pct[k], color: COLORS[k] || "#999" }));

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const R = 110;
  const r = 70;

  // background ring
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = "rgba(15,18,28,0.04)";
  ctx.fill();

  let a = -Math.PI / 2;
  for (const e of entries) {
    const ang = (e.pct / 100) * Math.PI * 2;
    if (ang <= 0) continue;

    ctx.beginPath();
    ctx.arc(cx, cy, R, a, a + ang);
    ctx.arc(cx, cy, r, a + ang, a, true);
    ctx.closePath();
    ctx.fillStyle = e.color;
    ctx.fill();

    // slice divider
    ctx.strokeStyle = "rgba(255,255,255,0.90)";
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, a, a);
    ctx.stroke();
    ctx.globalAlpha = 1;

    a += ang;
  }

  // center label
  ctx.fillStyle = "rgba(15,18,28,0.55)";
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Total", cx, cy - 6);

  ctx.fillStyle = "rgba(15,18,28,0.92)";
  ctx.font = "900 18px ui-sans-serif, system-ui";
  ctx.fillText(`$${fmtMoney(total)}`, cx, cy + 18);
}

function renderRebalance() {
  const el = document.getElementById("rebalanceTrades");
  if (!el) return;

  const res = rebalanceSuggestions(state.holdings, state.targets);

  const rows = Object.keys(res.diff).map(k => {
    const d = res.diff[k];
    const amt = Math.round(d); // dollars
    const action = amt >= 0 ? "BUY" : "SELL";
    return { k, amt, action };
  });

  // Sort by biggest absolute move first
  rows.sort((a,b) => Math.abs(b.amt) - Math.abs(a.amt));

  el.innerHTML = rows.map(r => `
    <div class="trade">
      <div class="trade__k">${r.k}</div>
      <div class="trade__v ${r.action === "BUY" ? "buy" : "sell"}">
        ${r.action} $${fmtMoney(Math.abs(r.amt))}
      </div>
    </div>
  `).join("");
}

function renderHoldingsTable() {
  const tbody = document.querySelector("#holdingsTable tbody");
  if (!tbody) return;

  const total = portfolioTotal(state.holdings);

  tbody.innerHTML = "";
  for (const h of state.holdings) {
    const v = computeValue(h);
    const w = total === 0 ? 0 : (v / total) * 100;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${h.ticker}</td>
      <td>${h.name}</td>
      <td>${h.assetClass}</td>
      <td>${h.sector}</td>
      <td class="num">${fmtMoney(h.shares)}</td>
      <td class="num">$${fmtMoney(h.price)}</td>
      <td class="num">$${fmtMoney(v)}</td>
      <td class="num">${w.toFixed(2)}%</td>
      <td class="num">${(h.riskScore ?? 0).toFixed(0)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderAll() {
  renderHeaderTotals();
  renderTargetsBox();
  renderRiskBadges();
  renderAllocationLegend();
  drawDonut();
  renderMetrics();
  renderRebalance();
  renderHoldingsTable();
}

// ---------- Sorting ----------
function sortByValue() {
  state.holdings.sort((a,b) => computeValue(b) - computeValue(a));
  renderHoldingsTable();
}
function sortByRisk() {
  state.holdings.sort((a,b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
  renderHoldingsTable();
}

// ---------- CSV upload ----------
function parseCSV(text) {
  // minimal CSV parser (handles commas, no quoted commas)
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(x => x.trim());
  const idx = (name) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

  const required = ["ticker","name","assetClass","sector","shares","price","riskScore"];
  for (const r of required) {
    if (idx(r) === -1) throw new Error(`Missing column: ${r}`);
  }

  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(x => x.trim());
    const h = {
      ticker: cols[idx("ticker")] || "",
      name: cols[idx("name")] || "",
      assetClass: cols[idx("assetClass")] || "Equity",
      sector: cols[idx("sector")] || "—",
      shares: Number(cols[idx("shares")] || "0"),
      price: Number(cols[idx("price")] || "0"),
      riskScore: Number(cols[idx("riskScore")] || "0"),
    };
    if (!h.ticker) continue;
    out.push(h);
  }
  return out;
}

// ---------- Boot ----------
function boot() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  document.getElementById("loadSampleBtn")?.addEventListener("click", loadSample);
  document.getElementById("randomBtn")?.addEventListener("click", generateRandomPortfolio);
  document.getElementById("sortValueBtn")?.addEventListener("click", sortByValue);
  document.getElementById("sortRiskBtn")?.addEventListener("click", sortByRisk);

  document.getElementById("resetTargetsBtn")?.addEventListener("click", () => {
    state.targets = { ...DEFAULT_TARGETS };
    renderTargetsBox();
    renderTargetForm();
    renderAll();
  });

  // CSV upload
  const csvInput = document.getElementById("csvInput");
  csvInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const rows = parseCSV(text);
      if (!rows.length) throw new Error("No rows found.");
      state.holdings = rows;
      renderAll();
    } catch (err) {
      alert(`CSV error: ${err?.message || err}`);
    } finally {
      e.target.value = "";
    }
  });

  // Targets form
  renderTargetForm();

  // Start with sample so it looks alive immediately
  loadSample();

  // Redraw donut on resize
  let t = 0;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => drawDonut(), 120);
  });
}

document.addEventListener("DOMContentLoaded", boot);
