const $ = (id) => document.getElementById(id);

/* ---------- Footer year ---------- */
(function setYear(){
  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* ---------- Hero background (particle drift) ---------- */
(function heroBG(){
  const c = $("bgCanvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  let W=0, H=0, dpr=1;
  const N = 85;
  const pts = Array.from({length:N}, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0008,
    vy: (Math.random() - 0.5) * 0.0008,
    r: 0.6 + Math.random() * 1.8
  }));

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = c.clientWidth;
    H = c.clientHeight;
    c.width = Math.floor(W*dpr);
    c.height = Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener("resize", resize);

  function frame(){
    ctx.clearRect(0,0,W,H);

    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0, "rgba(103,167,255,0.10)");
    g.addColorStop(1, "rgba(143,227,209,0.10)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    for (const p of pts){
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05) p.x = -0.05;
      if (p.y < -0.05) p.y = 1.05;
      if (p.y > 1.05) p.y = -0.05;

      const x = p.x * W;
      const y = p.y * H;

      ctx.beginPath();
      ctx.arc(x,y,p.r,0,Math.PI*2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (let i=0;i<pts.length;i++){
      for (let j=i+1;j<pts.length;j++){
        const a=pts[i], b=pts[j];
        const dx=(a.x-b.x)*W, dy=(a.y-b.y)*H;
        const dist=Math.hypot(dx,dy);
        if (dist < 130){
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x*W,a.y*H);
          ctx.lineTo(b.x*W,b.y*H);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- Quote spark chart (3 lines) ---------- */
(function quoteSpark(){
  const canvas = $("spark");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scoreEl = $("impactScore");
  const chgEl = $("impactChg");

  let score = 92.4;
  let seriesA = genSeries(60, 50);
  let seriesB = genSeries(55, 50);
  let seriesC = genSeries(50, 50);

  function clamp(x,a,b){ return Math.max(a, Math.min(b,x)); }
  function genSeries(base, n){
    let v = base;
    const out = [];
    for (let i=0;i<n;i++){
      v += (Math.random()-0.45) * 2.2;
      v = clamp(v, 35, 85);
      out.push(v);
    }
    return out;
  }

  function resize(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w*dpr);
    canvas.height = Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();

  window.addEventListener("resize", () => {
    clearTimeout(window.__sparkT);
    window.__sparkT = setTimeout(() => { resize(); draw(); }, 100);
  });

  function draw(){
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i=1;i<=4;i++){
      const y = (h/5)*i;
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(w,y);
      ctx.stroke();
    }

    drawLine(seriesA, "rgba(103,167,255,0.95)");
    drawLine(seriesB, "rgba(143,227,209,0.95)");
    drawLine(seriesC, "rgba(183,139,255,0.92)");
  }

  function drawLine(arr, color){
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pad = 10;
    const min = 30, max = 90;

    const toXY = (i, v) => {
      const x = pad + (i/(arr.length-1))*(w-2*pad);
      const y = h - pad - ((v-min)/(max-min))*(h-2*pad);
      return [x,y];
    };

    ctx.beginPath();
    arr.forEach((v,i) => {
      const [x,y] = toXY(i,v);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function updateScore(delta){
    const prev = score;
    score = Math.max(80, Math.min(99.9, score + delta));
    const chg = score - prev;

    if (scoreEl) scoreEl.textContent = score.toFixed(1);
    if (chgEl){
      const pct = (chg / prev) * 100;
      const good = chg >= 0;
      chgEl.className = "chg " + (good ? "good" : "bad");
      chgEl.textContent = `${good ? "+" : ""}${chg.toFixed(1)} ( ${good ? "+" : ""}${pct.toFixed(2)}% )`;
    }
  }

  function simulateDay(){
    seriesA = seriesA.slice(1).concat(clamp(seriesA.at(-1) + (Math.random()-0.45)*3.2, 35, 85));
    seriesB = seriesB.slice(1).concat(clamp(seriesB.at(-1) + (Math.random()-0.50)*2.6, 35, 85));
    seriesC = seriesC.slice(1).concat(clamp(seriesC.at(-1) + (Math.random()-0.40)*3.4, 35, 85));
    updateScore((Math.random() - 0.35) * 1.8);
    draw();
  }

  $("simulateBtn")?.addEventListener("click", simulateDay);
  draw();
})();

/* ---------- Toggle details ---------- */
(function detailsToggle(){
  const btn = $("toggleDetailsBtn");
  const box = $("detailBox");
  if (!btn || !box) return;
  btn.addEventListener("click", () => box.classList.toggle("is-open"));
})();

/* ---------- Project tabs + iframe ---------- */
(function projectTabs(){
  const frame = $("projFrame");
  const openBtn = $("openNewBtn");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  if (!frame || tabs.length === 0) return;

  function setActive(tab){
    tabs.forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const src = tab.getAttribute("data-src");
    if (src) frame.src = src;
    if (openBtn && src) openBtn.href = src;
  }

  tabs.forEach(tab => tab.addEventListener("click", () => setActive(tab)));
})();

/* ---------- Contact: copy email + open mail draft ---------- */
(function contact(){
  const emailLink = $("emailLink");
  const copyBtn = $("copyEmailBtn");
  const form = $("contactForm");

  if (copyBtn && emailLink){
    copyBtn.addEventListener("click", async () => {
      const email = emailLink.textContent.trim();
      try{
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = "Copied";
        setTimeout(() => (copyBtn.textContent = "Copy"), 900);
      }catch{
        alert("Copy blocked by browser. You can manually copy the email.");
      }
    });
  }

  if (form && emailLink){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const to = emailLink.getAttribute("href")?.replace("mailto:", "") || "your@email.com";
      const name = $("c_name").value.trim();
      const from = $("c_email").value.trim();
      const msg = $("c_msg").value.trim();

      const subject = encodeURIComponent(`Portfolio Contact — ${name || "Message"}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${from}\n\n${msg}\n`
      );

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }
})();
