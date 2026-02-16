/* =========================
   1) HERO moving background
   ========================= */
   function setupBackground() {
    const canvas = document.getElementById("bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
  
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
  
    // Particles + soft links
    const count = Math.floor(Math.min(160, Math.max(90, (w * h) / 12000)));
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 1.4
    }));
  
    let t = 0;
    function tick() {
      t += 1;
  
      // background fade
      ctx.clearRect(0, 0, w, h);
  
      // subtle gradient wash
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(83,246,212,0.08)");
      g.addColorStop(0.45, "rgba(255,255,255,0.00)");
      g.addColorStop(1, "rgba(122,167,255,0.08)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
  
      // drift
      for (const p of pts) {
        // gentle "current"
        p.vx += Math.sin((p.y + t) * 0.002) * 0.002;
        p.vy += Math.cos((p.x + t) * 0.002) * 0.002;
  
        // clamp speed
        p.vx = Math.max(-0.6, Math.min(0.6, p.vx));
        p.vy = Math.max(-0.6, Math.min(0.6, p.vy));
  
        p.x += p.vx;
        p.y += p.vy;
  
        // wrap
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }
  
      // lines
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.16;
            ctx.strokeStyle = `rgba(83,246,212,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
  
      // dots
      for (const p of pts) {
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
  
      requestAnimationFrame(tick);
    }
  
    // Respect reduced motion
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) tick();
  }
  
  /* =========================
     2) Market demo data + chart
     ========================= */
  const DEMO = {
    TSLA: { name: "Tesla, Inc. (Demo)", base: 210, vol: 0.025 },
    SPY:  { name: "S&P 500 ETF (Demo)", base: 485, vol: 0.010 },
    NVDA: { name: "NVIDIA (Demo)", base: 700, vol: 0.020 },
    AAPL: { name: "Apple (Demo)", base: 190, vol: 0.012 },
    BTC:  { name: "Bitcoin (Demo)", base: 52000, vol: 0.030 }
  };
  
  function money(x) {
    const abs = Math.abs(x);
    const hasCents = abs < 1000;
    const opts = hasCents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 };
    return x.toLocaleString(undefined, opts);
  }
  
  function generateSeries(seedBase, vol, points) {
    // geometric random walk (demo)
    const out = [];
    let price = seedBase;
    let date = new Date();
    date.setDate(date.getDate() - points);
  
    for (let i = 0; i < points; i++) {
      date = new Date(date.getTime());
      date.setDate(date.getDate() + 1);
  
      const drift = 0.00015; // slight upward drift (demo)
      const noise = (Math.random() - 0.5) * 2 * vol;
      price *= (1 + drift + noise);
  
      // candles
      const open = price * (1 + (Math.random() - 0.5) * vol * 0.6);
      const high = Math.max(open, price) * (1 + Math.random() * vol * 0.7);
      const low  = Math.min(open, price) * (1 - Math.random() * vol * 0.7);
      const close = price;
  
      out.push({
        t: new Date(date),
        open, high, low, close
      });
    }
    return out;
  }
  
  const RANGES = {
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365
  };
  
  const state = {
    ticker: "TSLA",
    range: "6M",
    series: {},
    watch: ["TSLA", "SPY", "NVDA", "AAPL", "BTC"]
  };
  
  function ensureData(ticker) {
    if (!state.series[ticker]) {
      const meta = DEMO[ticker] || { name: `${ticker} (Demo)`, base: 100, vol: 0.02 };
      state.series[ticker] = generateSeries(meta.base, meta.vol, 420);
    }
  }
  
  function sliceRange(ticker) {
    ensureData(ticker);
    const points = RANGES[state.range] || 180;
    const full = state.series[ticker];
    return full.slice(Math.max(0, full.length - points));
  }
  
  function computeStats(data) {
    const closes = data.map(d => d.close);
    const last = closes[closes.length - 1];
    const first = closes[0];
    const change = last - first;
    const pct = first === 0 ? 0 : (change / first) * 100;
  
    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
  
    // simple "volatility" estimate (stdev of daily returns)
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i-1]) / closes[i-1]);
    }
    const mean = returns.reduce((a,b)=>a+b,0) / Math.max(1, returns.length);
    const varr = returns.reduce((a,b)=>a+(b-mean)*(b-mean),0) / Math.max(1, returns.length);
    const vol = Math.sqrt(varr) * Math.sqrt(252) * 100;
  
    return { first, last, change, pct, high, low, vol };
  }
  
  function drawChart(canvas, data, accent = "#53f6d4") {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
    const pad = { l: 46, r: 18, t: 16, b: 34 };
    const W = cssW, H = cssH;
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
  
    const closes = data.map(d => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = Math.max(1e-9, max - min);
  
    const x = (i) => pad.l + (i / (data.length - 1)) * iw;
    const y = (v) => pad.t + (1 - (v - min) / span) * ih;
  
    // bg grid
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.45;
  
    // horizontal grid
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = pad.t + (i / 4) * ih;
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(W - pad.r, yy);
      ctx.stroke();
    }
  
    // y labels
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "12px ui-sans-serif, system-ui";
    for (let i = 0; i <= 4; i++) {
      const vv = max - (i / 4) * span;
      const yy = pad.t + (i / 4) * ih;
      ctx.fillText(money(vv), 10, yy + 4);
    }
    ctx.restore();
  
    // line
    ctx.lineWidth = 2;
    ctx.strokeStyle = accent;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const px = x(i);
      const py = y(closes[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  
    // area fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ih);
    grad.addColorStop(0, "rgba(83,246,212,0.18)");
    grad.addColorStop(1, "rgba(83,246,212,0.00)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const px = x(i);
      const py = y(closes[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(x(data.length - 1), pad.t + ih);
    ctx.lineTo(x(0), pad.t + ih);
    ctx.closePath();
    ctx.fill();
  
    // x labels (3 ticks)
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "12px ui-sans-serif, system-ui";
    const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1];
    for (const i of ticks) {
      const d = data[i].t;
      const label = d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
      ctx.fillText(label, x(i) - 18, H - 12);
    }
  
    return { pad, W, H, iw, ih, x, y, min, max, closes };
  }
  
  function renderWatchlist() {
    const el = document.getElementById("watchlist");
    if (!el) return;
    el.innerHTML = "";
  
    state.watch.forEach(t => {
      ensureData(t);
      const data = sliceRange(t);
      const s = computeStats(data);
      const pos = s.change >= 0;
  
      const div = document.createElement("div");
      div.className = "wItem";
      div.innerHTML = `
        <div class="wLeft">
          <div class="wTicker">${t}</div>
          <div class="wName">${(DEMO[t]?.name || `${t} (Demo)`).replace("(Demo)", "").trim()}</div>
        </div>
        <div class="wRight">
          <div class="wPrice">$${money(s.last)}</div>
          <div class="wChange ${pos ? "pos":"neg"}">${pos ? "+" : ""}${money(s.change)} (${pos ? "+" : ""}${s.pct.toFixed(2)}%)</div>
        </div>
      `;
      div.addEventListener("click", () => {
        state.ticker = t;
        renderMarket();
      });
      el.appendChild(div);
    });
  }
  
  function renderMarket() {
    const ticker = state.ticker;
    const meta = DEMO[ticker] || { name: `${ticker} (Demo)` };
    const data = sliceRange(ticker);
    const s = computeStats(data);
  
    // headline
    const tEl = document.getElementById("ticker");
    const nEl = document.getElementById("companyName");
    const pEl = document.getElementById("price");
    const cEl = document.getElementById("change");
  
    if (tEl) tEl.textContent = ticker;
    if (nEl) nEl.textContent = meta.name;
    if (pEl) pEl.textContent = `$${money(s.last)}`;
  
    const pos = s.change >= 0;
    if (cEl) {
      cEl.textContent = `${pos ? "+" : ""}${money(s.change)} (${pos ? "+" : ""}${s.pct.toFixed(2)}%)`;
      cEl.classList.toggle("pos", pos);
      cEl.classList.toggle("neg", !pos);
    }
  
    // stats row
    const statsRow = document.getElementById("statsRow");
    if (statsRow) {
      statsRow.innerHTML = "";
      const items = [
        ["Range", state.range],
        ["High", `$${money(s.high)}`],
        ["Low", `$${money(s.low)}`],
        ["Vol (ann.)", `${s.vol.toFixed(1)}%`]
      ];
      for (const [k,v] of items) {
        const d = document.createElement("div");
        d.className = "stat";
        d.innerHTML = `<div class="stat__k">${k}</div><div class="stat__v">${v}</div>`;
        statsRow.appendChild(d);
      }
    }
  
    // key-value panel
    const kv = document.getElementById("kv");
    if (kv) {
      const day = data[data.length - 1];
      const prev = data[data.length - 2] || day;
      const dayChg = day.close - prev.close;
      const dayPct = prev.close === 0 ? 0 : (dayChg / prev.close) * 100;
  
      const rows = [
        ["Last", `$${money(day.close)}`],
        ["Open", `$${money(day.open)}`],
        ["Day High", `$${money(day.high)}`],
        ["Day Low", `$${money(day.low)}`],
        ["Day Change", `${dayChg >= 0 ? "+" : ""}${money(dayChg)} (${dayPct >= 0 ? "+" : ""}${dayPct.toFixed(2)}%)`],
        ["Data Mode", "Local demo"]
      ];
  
      kv.innerHTML = rows.map(([k,v]) => `
        <div class="kvRow">
          <div class="kvK">${k}</div>
          <div class="kvV">${v}</div>
        </div>
      `).join("");
    }
  
    // OHLC table (last 10 rows)
    const table = document.querySelector("#ohlcTable tbody");
    if (table) {
      table.innerHTML = "";
      const lastN = data.slice(-10).reverse();
      for (const d of lastN) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${d.t.toLocaleDateString(undefined, { year:"2-digit", month:"short", day:"2-digit" })}</td>
          <td>$${money(d.open)}</td>
          <td>$${money(d.high)}</td>
          <td>$${money(d.low)}</td>
          <td>$${money(d.close)}</td>
        `;
        table.appendChild(tr);
      }
    }
  
    // draw chart
    const chart = document.getElementById("chart");
    if (!chart) return;
  
    const geom = drawChart(chart, data, "#53f6d4");
    if (!geom) return;
  
    // tooltip hover
    const tooltip = document.getElementById("tooltip");
    let raf = 0;
  
    function onMove(e) {
      if (!tooltip) return;
      const rect = chart.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
  
      // Only show if inside plot area
      if (mx < geom.pad.l || mx > geom.W - geom.pad.r || my < geom.pad.t || my > geom.H - geom.pad.b) {
        tooltip.style.opacity = 0;
        return;
      }
  
      // nearest index
      const rel = (mx - geom.pad.l) / geom.iw;
      const idx = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))));
      const d = data[idx];
  
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const px = geom.x(idx);
        const py = geom.y(d.close);
        tooltip.style.opacity = 1;
        tooltip.style.left = `${px}px`;
        tooltip.style.top = `${py}px`;
        tooltip.textContent = `${d.t.toLocaleDateString(undefined, { month:"short", day:"2-digit" })} • $${money(d.close)}`;
      });
    }
  
    function onLeave() {
      if (tooltip) tooltip.style.opacity = 0;
    }
  
    chart.onmousemove = onMove;
    chart.onmouseleave = onLeave;
  }
  
  function bindMarketControls() {
    // range segment
    document.querySelectorAll(".seg__btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".seg__btn").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.range = btn.getAttribute("data-range") || "6M";
        renderWatchlist();
        renderMarket();
      });
    });
  
    // simulate new day = append one candle for each ticker
    const randBtn = document.getElementById("randomizeBtn");
    if (randBtn) {
      randBtn.addEventListener("click", () => {
        for (const t of Object.keys(state.series)) {
          const meta = DEMO[t] || { base: 100, vol: 0.02 };
          const series = state.series[t];
          const last = series[series.length - 1];
          const date = new Date(last.t);
          date.setDate(date.getDate() + 1);
  
          // evolve from last close
          let price = last.close;
          const drift = 0.00015;
          const noise = (Math.random() - 0.5) * 2 * meta.vol;
          price *= (1 + drift + noise);
  
          const open = price * (1 + (Math.random() - 0.5) * meta.vol * 0.6);
          const high = Math.max(open, price) * (1 + Math.random() * meta.vol * 0.7);
          const low  = Math.min(open, price) * (1 - Math.random() * meta.vol * 0.7);
          const close = price;
  
          series.push({ t: date, open, high, low, close });
          if (series.length > 520) series.shift();
        }
        renderWatchlist();
        renderMarket();
      });
    }
  
    // add ticker (demo)
    const addBtn = document.getElementById("addTickerBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const t = prompt("Add ticker (demo): TSLA, SPY, NVDA, AAPL, BTC");
        if (!t) return;
        const up = t.trim().toUpperCase();
        if (!state.watch.includes(up)) state.watch.unshift(up);
        ensureData(up);
        renderWatchlist();
        renderMarket();
      });
    }
  }
  
  /* =========================
     3) Theme toggle (simple)
     ========================= */
  function bindTheme() {
    const btn = document.getElementById("themeBtn");
    if (!btn) return;
    const root = document.documentElement;
  
    const saved = localStorage.getItem("theme2");
    if (saved) root.setAttribute("data-theme", saved);
  
    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme") || "dark";
      const next = cur === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme2", next);
    });
  }
  
  // Light theme override (kept minimal)
  const style = document.createElement("style");
  style.textContent = `
    [data-theme="light"] body{
      background: radial-gradient(1200px 700px at 20% 10%, rgba(83,246,212,.10), transparent 55%),
                  radial-gradient(900px 650px at 85% 15%, rgba(122,167,255,.12), transparent 60%),
                  #f6f7fb;
      color: rgba(15,18,28,.92);
    }
    [data-theme="light"] .nav{ background: rgba(246,247,251,.72); border-bottom: 1px solid rgba(15,18,28,.10); }
    [data-theme="light"] .nav__name{ color: rgba(15,18,28,.82); }
    [data-theme="light"] .nav__link{ color: rgba(15,18,28,.65); }
    [data-theme="light"] .card{ background: rgba(15,18,28,.04); border-color: rgba(15,18,28,.12); box-shadow: 0 18px 55px rgba(0,0,0,.10); }
    [data-theme="light"] .btn--ghost{ background: rgba(15,18,28,.04); border-color: rgba(15,18,28,.12); color: rgba(15,18,28,.9); }
    [data-theme="light"] .btn--solid{ color: #07101a; }
    [data-theme="light"] .table th, [data-theme="light"] .table td{ color: rgba(15,18,28,.78); border-bottom-color: rgba(15,18,28,.10); }
    [data-theme="light"] .table th{ color: rgba(15,18,28,.55); }
    [data-theme="light"] .hero__badge{ background: rgba(255,255,255,.70); border-color: rgba(15,18,28,.12); color: rgba(15,18,28,.75); }
    [data-theme="light"] .hero__sub{ color: rgba(15,18,28,.70); }
    [data-theme="light"] .chip{ background: rgba(15,18,28,.04); border-color: rgba(15,18,28,.12); color: rgba(15,18,28,.70); }
  `;
  document.head.appendChild(style);
  
  /* =========================
     Boot
     ========================= */
  function boot() {
    // year
    const y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  
    setupBackground();
  
    // market init
    state.watch.forEach(ensureData);
    renderWatchlist();
    bindMarketControls();
    renderMarket();
  
    // theme
    bindTheme();
  
    // re-render chart on resize (debounced)
    let to = 0;
    window.addEventListener("resize", () => {
      clearTimeout(to);
      to = setTimeout(() => renderMarket(), 120);
    });
  }
  
  document.addEventListener("DOMContentLoaded", boot);
  