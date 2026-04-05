const $ = (id) => document.getElementById(id);

/* =========================
   1) Footer year
   ========================= */
function setYear() {
  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());
}

/* =========================
   2) HERO moving background
   ========================= */
function setupBackground() {
  const canvas = $("bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let w = 0, h = 0, dpr = 1;
  let pts = [];

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.floor(Math.min(160, Math.max(90, (w * h) / 12000)));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 1.4
    }));
  }

  resize();
  window.addEventListener("resize", resize);

  let t = 0;

  function tick() {
    t += 1;
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(83,246,212,0.08)");
    g.addColorStop(0.45, "rgba(255,255,255,0.00)");
    g.addColorStop(1, "rgba(122,167,255,0.08)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (const p of pts) {
      p.vx += Math.sin((p.y + t) * 0.002) * 0.002;
      p.vy += Math.cos((p.x + t) * 0.002) * 0.002;

      p.vx = Math.max(-0.6, Math.min(0.6, p.vx));
      p.vy = Math.max(-0.6, Math.min(0.6, p.vy));

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;
    }

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

    for (const p of pts) {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduce) tick();
}

/* =========================
   3) Stock-style profile spark chart
   ========================= */
function quoteSpark() {
  const canvas = $("spark");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scoreEl = $("impactScore");
  const chgEl = $("impactChg");

  let score = 92.4;
  let seriesA = genSeries(50, 50);
  let seriesB = genSeries(55, 50);
  let seriesC = genSeries(52, 50);

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function genSeries(base, n) {
    let v = base;
    const out = [];
    for (let i = 0; i < n; i++) {
      v += (Math.random() - 0.45) * 2.2;
      v = clamp(v, 35, 85);
      out.push(v);
    }
    return out;
  }

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();

  window.addEventListener("resize", () => {
    clearTimeout(window.__sparkT);
    window.__sparkT = setTimeout(() => {
      resize();
      draw();
    }, 100);
  });

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    drawLine(seriesA, "rgba(122,167,255,0.95)");
    drawLine(seriesB, "rgba(83,246,212,0.95)");
    drawLine(seriesC, "rgba(183,139,255,0.92)");
  }

  function drawLine(arr, color) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pad = 10;
    const min = 30;
    const max = 90;

    const toXY = (i, v) => {
      const x = pad + (i / (arr.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
      return [x, y];
    };

    ctx.beginPath();
    arr.forEach((v, i) => {
      const [x, y] = toXY(i, v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function updateScore(delta) {
    const prev = score;
    score = Math.max(80, Math.min(99.9, score + delta));
    const chg = score - prev;

    if (scoreEl) scoreEl.textContent = score.toFixed(1);

    if (chgEl) {
      const pct = (chg / prev) * 100;
      const good = chg >= 0;
      chgEl.className = "chg " + (good ? "good" : "bad");
      chgEl.textContent = `${good ? "+" : ""}${chg.toFixed(1)} ( ${good ? "+" : ""}${pct.toFixed(2)}% )`;
    }
  }

  function simulateDay() {
    seriesA = seriesA.slice(1).concat(
      clamp(seriesA.at(-1) + (Math.random() - 0.45) * 3.2, 35, 85)
    );
    seriesB = seriesB.slice(1).concat(
      clamp(seriesB.at(-1) + (Math.random() - 0.5) * 2.6, 35, 85)
    );
    seriesC = seriesC.slice(1).concat(
      clamp(seriesC.at(-1) + (Math.random() - 0.4) * 3.4, 35, 85)
    );

    updateScore((Math.random() - 0.35) * 1.8);
    draw();
  }

  $("simulateBtn")?.addEventListener("click", simulateDay);
  draw();
}

/* =========================
   4) Toggle details
   ========================= */
function bindDetailsToggle() {
  const btn = $("toggleDetailsBtn");
  const box = $("detailBox");
  if (!btn || !box) return;

  btn.addEventListener("click", () => {
    box.classList.toggle("is-open");
  });
}

/* =========================
   5) Project tabs + iframe
   ========================= */
function bindProjectTabs() {
  const frame = $("projFrame");
  const frameWrap = $("projFrameWrap");
  const chatbotPanel = $("chatbotProjectPanel");
  const openBtn = $("openNewBtn");
  const tabs = Array.from(document.querySelectorAll(".projTabs .tab"));

  if (!tabs.length) return null;

  function setActiveProject(projectKey) {
    const tab = tabs.find((t) => t.dataset.project === projectKey) || tabs[0];
    if (!tab) return;

    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");

    const isChatbot = tab.dataset.project === "chatbot";

    if (chatbotPanel) chatbotPanel.classList.toggle("is-hidden", !isChatbot);
    if (frameWrap) frameWrap.classList.toggle("is-hidden", isChatbot);

    if (isChatbot) {
      openBtn?.classList.add("is-hidden");
      return;
    }

    const src = tab.dataset.src;
    if (src && frame) {
      frame.src = src;
      if (openBtn) {
        openBtn.href = src;
        openBtn.classList.remove("is-hidden");
      }
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveProject(tab.dataset.project || "chatbot");
    });
  });

  return { setActiveProject };
}

/* =========================
   6) Theme toggle
   ========================= */
function bindTheme() {
  const btn = $("themeBtn");
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

function injectLightTheme() {
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
    [data-theme="light"] .nav__logo{ color: rgba(15,18,28,.92); border-color: rgba(15,18,28,.12); background: rgba(15,18,28,.04); }
    [data-theme="light"] .card{ background: rgba(15,18,28,.04); border-color: rgba(15,18,28,.12); box-shadow: 0 18px 55px rgba(0,0,0,.10); }
    [data-theme="light"] .btn--ghost{ background: rgba(15,18,28,.04); border-color: rgba(15,18,28,.12); color: rgba(15,18,28,.9); }
    [data-theme="light"] .btn--solid{ color: #07101a; }
    [data-theme="light"] .hero__badge{ background: rgba(255,255,255,.70); border-color: rgba(15,18,28,.12); color: rgba(15,18,28,.75); }
    [data-theme="light"] .hero__sub{ color: rgba(15,18,28,.70); }
    [data-theme="light"] .chip{ background: rgba(15,18,28,.04); border-color: rgba(15,18,28,.12); color: rgba(15,18,28,.70); }
    [data-theme="light"] .pageHead__desc,
    [data-theme="light"] .resumeText,
    [data-theme="light"] .contactHint,
    [data-theme="light"] .fine,
    [data-theme="light"] .sideK,
    [data-theme="light"] .muted2,
    [data-theme="light"] .fundK,
    [data-theme="light"] .newsTime{ color: rgba(15,18,28,.60); }
    [data-theme="light"] .tickerName,
    [data-theme="light"] .newsText,
    [data-theme="light"] .sideV,
    [data-theme="light"] .fundV,
    [data-theme="light"] .contactVal,
    [data-theme="light"] .footerLink,
    [data-theme="light"] .nav__logo{ color: rgba(15,18,28,.88); }
    [data-theme="light"] .ticker,
    [data-theme="light"] .pill,
    [data-theme="light"] .fund,
    [data-theme="light"] .skillCard,
    [data-theme="light"] .newsItem,
    [data-theme="light"] .detailBox,
    [data-theme="light"] .tab,
    [data-theme="light"] .contactRow,
    [data-theme="light"] .input{
      border-color: rgba(15,18,28,.12);
      background: rgba(15,18,28,.04);
      color: rgba(15,18,28,.90);
    }
    [data-theme="light"] .spark,
    [data-theme="light"] #projFrame,
    [data-theme="light"] .projFrameWrap{
      border-color: rgba(15,18,28,.12);
    }
    [data-theme="light"] .tickerTape{
      border-top: 1px solid rgba(15,18,28,.10);
      background: rgba(15,18,28,.04);
    }
    [data-theme="light"] .tape{
      color: rgba(15,18,28,.58);
    }
  `;
  document.head.appendChild(style);
}

/* =========================
   7) Contact actions
   ========================= */
function bindContact() {
  const emailLink = $("emailLink");
  const copyBtn = $("copyEmailBtn");
  const form = $("contactForm");

  if (copyBtn && emailLink) {
    copyBtn.addEventListener("click", async () => {
      const email = emailLink.textContent.trim();
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = "Copied";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 900);
      } catch {
        alert("Copy blocked by browser. You can manually copy the email.");
      }
    });
  }

  if (form && emailLink) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const to =
        emailLink.getAttribute("href")?.replace("mailto:", "") ||
        "you@email.com";
      const name = $("c_name")?.value.trim() || "";
      const from = $("c_email")?.value.trim() || "";
      const msg = $("c_msg")?.value.trim() || "";

      const subject = encodeURIComponent(
        `Portfolio Contact — ${name || "Message"}`
      );
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${from}\n\n${msg}\n`
      );

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }
}

/* =========================
   8) Chatbot
   ========================= */
function initWebbot() {
  const form = document.getElementById("webbotForm");
  const input = document.getElementById("webbotInput");
  const messages = document.getElementById("webbotMessages");
  const status = document.getElementById("webbotStatus");
  const sendBtn = document.getElementById("webbotSendBtn");
  const newChatBtn = document.getElementById("webbotNewChatBtn");
  const heroAskForm = document.getElementById("heroAskForm");
  const heroAskInput = document.getElementById("heroAskInput");

  if (!form || !input || !messages || !status || !sendBtn) return null;

  const API_URL = "https://princeton-semideterministic-catarrhally.ngrok-free.dev/api/chat";
  const SESSION_KEY = "tristan_webbot_session_id";

  const getSessionId = () => sessionStorage.getItem(SESSION_KEY) || "";

  const setSessionId = (sessionId) => {
    if (sessionId) {
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
  };

  const clearSessionId = () => {
    sessionStorage.removeItem(SESSION_KEY);
  };

  const addMessage = (text, type = "bot") => {
    const div = document.createElement("div");
    div.className = `webbotMsg webbotMsg--${type}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  };

  const resetChatUi = () => {
    messages.innerHTML = "";
    addMessage(
      "Hi — I can help with Tristan’s background, projects, skills, public links, and contact or meeting requests.",
      "bot"
    );
    status.textContent = "Chatbot is online";
    input.value = "";
    input.focus();
  };

  const setThinking = (isThinking) => {
    if (isThinking) {
      status.textContent = "Chatbot is thinking...";
      sendBtn.disabled = true;
      input.disabled = true;
      if (newChatBtn) newChatBtn.disabled = true;
    } else {
      status.textContent = "Chatbot is online";
      sendBtn.disabled = false;
      input.disabled = false;
      if (newChatBtn) newChatBtn.disabled = false;
      input.focus();
    }
  };

  const submitMessage = async (message) => {
    const cleanMessage = (message || "").trim();
    if (!cleanMessage) return;

    addMessage(cleanMessage, "user");
    input.value = "";

    setThinking(true);
    const thinkingBubble = addMessage("Chatbot is thinking...", "thinking");

    try {
      const payload = {
        message: cleanMessage,
        session_id: getSessionId()
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      thinkingBubble.remove();

      if (!res.ok) {
        addMessage(data.error || "Sorry, something went wrong.", "bot");
      } else {
        if (data.session_id) {
          setSessionId(data.session_id);
        }

        addMessage(
          data.answer || "Sorry, I do not have a response right now.",
          "bot"
        );
      }
    } catch (err) {
      thinkingBubble.remove();
      addMessage("Sorry, the chatbot is unavailable right now.", "bot");
    } finally {
      setThinking(false);
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitMessage(input.value);
  });

  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      clearSessionId();
      resetChatUi();
    });
  }

  if (heroAskForm && heroAskInput) {
    heroAskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = heroAskInput.value.trim();
      if (!msg) return;

      window.location.hash = "#projects";

      const chatbotTab = document.querySelector('[data-project="chatbot"]');
      if (chatbotTab) chatbotTab.click();

      input.value = msg;
      heroAskInput.value = "";

      setTimeout(() => {
        form.requestSubmit();
      }, 120);
    });
  }

  return {
    submitMessage,
    resetChatUi
  };
}

/* =========================
   9) Hero ask bar + jump tags
   ========================= */
function bindHeroAsk(projectApi, webbotApi) {
  const heroForm = $("heroAskForm");
  const heroInput = $("heroAskInput");
  const jumpLinks = Array.from(document.querySelectorAll("[data-project-jump]"));

  const jumpToChatbot = () => {
    projectApi?.setActiveProject("chatbot");
    document
      .getElementById("projects")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  jumpLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setTimeout(() => {
        jumpToChatbot();
        setTimeout(() => webbotApi?.focus(), 350);
      }, 0);
    });
  });

  if (!heroForm || !heroInput) return;

  heroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = heroInput.value.trim();
    if (!message) return;

    jumpToChatbot();
    heroInput.value = "";

    setTimeout(async () => {
      if (webbotApi?.ask) {
        await webbotApi.ask(message);
      }
    }, 450);
  });
}

/* =========================
   10) Boot
   ========================= */
function boot() {
  setYear();
  injectLightTheme();
  setupBackground();
  quoteSpark();
  bindDetailsToggle();

  const projectApi = bindProjectTabs();
  const webbotApi = initWebbot();

  bindTheme();
  bindContact();
  bindHeroAsk(projectApi, webbotApi);

  projectApi?.setActiveProject("chatbot");
}

let isSending = false;

async function sendMessage() {
  if (isSending) return;

  const text = input.value.trim();
  if (!text) return;

  isSending = true;
  sendBtn.disabled = true;

  try {
    // send fetch here
  } finally {
    isSending = false;
    sendBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", boot);