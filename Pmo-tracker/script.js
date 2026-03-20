/* =========================================
   PMO Execution Tracker (Demo)
   - Static HTML/CSS/JS
   - Sample + random data
   - Filters + weekly status generator
   - Local persistence via localStorage
   ========================================= */

const KEY = "pmo_tracker_v1";

const owners = ["Tristan", "Ops Team", "Dev Team", "Vendor", "Stakeholder"];
const statuses = ["Open", "In Progress", "Blocked", "Done"];
const priorities = ["P0", "P1", "P2"];

let state = {
  actions: [],
  milestones: [],
  risks: []
};

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    state = JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}
function resetAll() {
  localStorage.removeItem(KEY);
  state = { actions: [], milestones: [], risks: [] };
  renderAll();
}

function daysFromToday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date();
  const a = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((d - a) / (1000 * 60 * 60 * 24));
}
function isoDatePlus(days) {
  const t = new Date();
  t.setHours(0,0,0,0);
  t.setDate(t.getDate() + days);
  return t.toISOString().slice(0, 10);
}

function badgeStatus(s) {
  if (s === "Done") return `<span class="badge bDone">Done</span>`;
  if (s === "Blocked") return `<span class="badge bBlock">Blocked</span>`;
  if (s === "In Progress") return `<span class="badge bProg">In Progress</span>`;
  return `<span class="badge bOpen">Open</span>`;
}
function badgePriority(p) {
  if (p === "P0") return `<span class="badge pP0">P0</span>`;
  if (p === "P1") return `<span class="badge pP1">P1</span>`;
  return `<span class="badge pP2">P2</span>`;
}

function loadSample() {
  state.actions = [
    { title: "Confirm client onboarding checklist version", owner: "Ops Team", priority: "P1", status: "In Progress", due: isoDatePlus(3), followUp: "Send reminder + ask for ETA" },
    { title: "Define data fields for weekly report (v1)", owner: "Tristan", priority: "P0", status: "Open", due: isoDatePlus(2), followUp: "Draft and circulate for sign-off" },
    { title: "Resolve access to shared drive / permissions", owner: "Stakeholder", priority: "P1", status: "Blocked", due: isoDatePlus(-2), followUp: "Escalate to IT owner" },
    { title: "Vendor confirms delivery dates for integration", owner: "Vendor", priority: "P2", status: "Open", due: isoDatePlus(8), followUp: "Request updated timeline" },
    { title: "Close last sprint action items", owner: "Dev Team", priority: "P2", status: "Done", due: isoDatePlus(-1), followUp: "N/A" },
  ];

  state.milestones = [
    { name: "Requirements locked", date: isoDatePlus(7), progress: 70 },
    { name: "UAT window", date: isoDatePlus(18), progress: 35 },
    { name: "Go-live readiness review", date: isoDatePlus(28), progress: 15 },
  ];

  state.risks = [
    { rag: "A", title: "Scope creep from last-minute requests", mitigation: "Lock v1 scope; queue v2 requests; weekly change review." },
    { rag: "R", title: "Dependency: access/permissions not resolved", mitigation: "Escalate; set deadline; provide workaround path." },
    { rag: "G", title: "Delivery cadence for weekly report", mitigation: "Template finalized; owners assigned; SLA agreed." },
  ];

  save();
  renderAll();
}

function randInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
function pick(arr){ return arr[randInt(0,arr.length-1)]; }

function generateRandom() {
  const actionPool = [
    "Clarify ownership for reconciliation exceptions",
    "Update stakeholder status deck (1-slide summary)",
    "Validate data mapping for dashboard fields",
    "Confirm compliance wording for client email",
    "Create action log from meeting notes",
    "Triage blocker and propose options",
    "Align timeline after scope change",
    "Document SOP for recurring process",
  ];

  const riskPool = [
    ["A","Timeline risk due to external dependency","Confirm owner; add buffer; weekly check-in."],
    ["R","Key requirement not signed off","Escalate for decision; timebox; document assumptions."],
    ["G","Delivery cadence stable","Keep weekly cadence; maintain action log."],
    ["A","Data quality issues from source system","Add validation rules; exception report; owner follow-up."],
  ];

  state.actions = Array.from({length: randInt(6,10)}, () => ({
    title: pick(actionPool),
    owner: pick(owners),
    priority: pick(priorities),
    status: pick(statuses),
    due: isoDatePlus(randInt(-4, 14)),
    followUp: "Follow up; confirm ETA; update status"
  }));

  state.milestones = Array.from({length: 3}, (_,i) => ({
    name: ["Scope locked","Build complete","UAT complete","Go-live review"][i] || `Milestone ${i+1}`,
    date: isoDatePlus(randInt(7 + i*7, 12 + i*10)),
    progress: randInt(10, 85)
  }));

  state.risks = Array.from({length: 3}, () => {
    const [rag,title,mitigation] = pick(riskPool);
    return { rag, title, mitigation };
  });

  save();
  renderAll();
}

function setOwnersFilterOptions() {
  const sel = $("fOwner");
  const uniqOwners = Array.from(new Set(state.actions.map(a => a.owner))).sort();
  sel.innerHTML = `<option value="all">Owner: All</option>` +
    uniqOwners.map(o => `<option value="${o}">${o}</option>`).join("");
}

function filteredActions() {
  const s = $("fStatus").value;
  const o = $("fOwner").value;
  const p = $("fPriority").value;

  return state.actions.filter(a => {
    if (s !== "all" && a.status !== s) return false;
    if (o !== "all" && a.owner !== o) return false;
    if (p !== "all" && a.priority !== p) return false;
    return true;
  });
}

function renderSnapshot() {
  const open = state.actions.filter(a => a.status !== "Done").length;
  const overdue = state.actions.filter(a => a.status !== "Done" && daysFromToday(a.due) < 0).length;
  const due7 = state.actions.filter(a => a.status !== "Done" && daysFromToday(a.due) >= 0 && daysFromToday(a.due) <= 7).length;
  $("openCount").textContent = String(open);
  $("due7").textContent = String(due7);
  $("overdue").textContent = String(overdue);

  const note = overdue > 0 ? `${overdue} overdue needs escalation` : `All items within SLA`;
  $("openNote").textContent = note;

  // Overall RAG (simple rules)
  const pill = $("overallPill");
  pill.className = "statusPill";
  if (overdue >= 2 || state.actions.some(a => a.status === "Blocked" && daysFromToday(a.due) < 0)) {
    pill.textContent = "RED (At Risk)";
    pill.classList.add("bad");
  } else if (overdue === 1 || state.actions.some(a => a.status === "Blocked")) {
    pill.textContent = "AMBER (Watch)";
    pill.classList.add("warn");
  } else {
    pill.textContent = "GREEN (On Track)";
    pill.classList.add("good");
  }
}

function renderActionsTable() {
  const tbody = document.querySelector("#actionsTable tbody");
  tbody.innerHTML = "";

  const rows = filteredActions().sort((a,b) => daysFromToday(a.due) - daysFromToday(b.due));

  for (const a of rows) {
    const d = daysFromToday(a.due);
    const dueLabel = new Date(a.due + "T00:00:00").toLocaleDateString(undefined, { month:"short", day:"2-digit" });

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.title}</td>
      <td>${a.owner}</td>
      <td>${badgePriority(a.priority)}</td>
      <td>${badgeStatus(a.status)}</td>
      <td class="num">${dueLabel}</td>
      <td class="num">${d === 0 ? "Today" : (d > 0 ? `${d}` : `${d}`)}</td>
      <td class="num">${a.followUp || "—"}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderMilestones() {
  const el = $("milestones");
  el.innerHTML = "";
  const sorted = [...state.milestones].sort((a,b) => new Date(a.date) - new Date(b.date));

  for (const m of sorted) {
    const dateLabel = new Date(m.date + "T00:00:00").toLocaleDateString(undefined, { month:"short", day:"2-digit", year:"numeric" });
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `
      <div class="itemTop">
        <div class="itemTitle">${m.name}</div>
        <div class="itemMeta">${dateLabel}</div>
      </div>
      <div class="progress"><div class="bar" style="width:${Math.max(0, Math.min(100, m.progress || 0))}%"></div></div>
      <div class="itemMeta">Progress: ${(m.progress || 0).toFixed(0)}%</div>
    `;
    el.appendChild(card);
  }
}

function renderRisks() {
  const el = $("risks");
  el.innerHTML = "";
  for (const r of state.risks) {
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `
      <div class="itemTop">
        <div class="itemTitle">${r.title}</div>
        <span class="rag ${r.rag}">${r.rag}</span>
      </div>
      <div class="itemMeta"><strong>Mitigation:</strong> ${r.mitigation}</div>
    `;
    el.appendChild(card);
  }
}

function makeWeeklyUpdateText() {
  const today = new Date().toLocaleDateString(undefined, { year:"numeric", month:"short", day:"2-digit" });

  const open = state.actions.filter(a => a.status !== "Done");
  const done = state.actions.filter(a => a.status === "Done");
  const overdue = open.filter(a => daysFromToday(a.due) < 0);
  const blocked = open.filter(a => a.status === "Blocked");

  const topOpen = [...open].sort((a,b) => {
    const pa = a.priority === "P0" ? 0 : a.priority === "P1" ? 1 : 2;
    const pb = b.priority === "P0" ? 0 : b.priority === "P1" ? 1 : 2;
    return pa - pb || (daysFromToday(a.due) - daysFromToday(b.due));
  }).slice(0, 5);

  const milestoneNext = [...state.milestones].sort((a,b)=>new Date(a.date)-new Date(b.date))[0];

  const lines = [];
  lines.push(`WEEKLY STATUS UPDATE — ${today}`);
  lines.push(`Overall: ${$("overallPill").textContent}`);
  lines.push("");
  lines.push("Highlights / Progress:");
  lines.push(`- Completed: ${done.length}`);
  if (milestoneNext) lines.push(`- Next milestone: ${milestoneNext.name} (${milestoneNext.date})`);
  lines.push("");
  lines.push("Top Action Items (next 7–10 days):");
  if (!topOpen.length) lines.push("- (None)");
  for (const a of topOpen) {
    lines.push(`- [${a.priority}] ${a.title} — Owner: ${a.owner} — Due: ${a.due} — Status: ${a.status}`);
  }
  lines.push("");
  lines.push("Risks / Issues:");
  if (!state.risks.length) lines.push("- (None)");
  for (const r of state.risks) {
    lines.push(`- (${r.rag}) ${r.title} | Mitigation: ${r.mitigation}`);
  }
  lines.push("");
  lines.push("Needs Attention / Escalations:");
  if (!overdue.length && !blocked.length) {
    lines.push("- None this week.");
  } else {
    for (const a of overdue) lines.push(`- Overdue: ${a.title} — Owner: ${a.owner} — Due: ${a.due}`);
    for (const a of blocked) lines.push(`- Blocked: ${a.title} — Owner: ${a.owner} — Due: ${a.due}`);
  }

  return lines.join("\n");
}

function renderWeekly() {
  $("weeklyText").value = makeWeeklyUpdateText();
}

function renderAll() {
  setOwnersFilterOptions();
  renderSnapshot();
  renderActionsTable();
  renderMilestones();
  renderRisks();
  renderWeekly();
}

/* ---------------- Modal: Add items ---------------- */
function openModal(title, fields, onSave) {
  const modal = $("modal");
  const body = $("formBody");
  const form = $("modalForm");
  $("modalTitle").textContent = title;

  body.innerHTML = fields.map(f => {
    if (f.type === "select") {
      return `
        <div class="row">
          <label for="${f.id}">${f.label}</label>
          <select id="${f.id}">
            ${f.options.map(o => `<option value="${o}">${o}</option>`).join("")}
          </select>
        </div>
      `;
    }
    if (f.type === "textarea") {
      return `
        <div class="row">
          <label for="${f.id}">${f.label}</label>
          <textarea id="${f.id}" placeholder="${f.placeholder || ""}"></textarea>
        </div>
      `;
    }
    return `
      <div class="row">
        <label for="${f.id}">${f.label}</label>
        <input id="${f.id}" type="${f.type || "text"}" placeholder="${f.placeholder || ""}" value="${f.value || ""}" />
      </div>
    `;
  }).join("");

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    form.onsubmit = null;
  };

  $("closeModalBtn").onclick = close;
  $("cancelBtn").onclick = close;

  form.onsubmit = (e) => {
    e.preventDefault();
    const data = {};
    for (const f of fields) data[f.key] = document.getElementById(f.id).value.trim();
    onSave(data);
    close();
  };

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

/* ---------------- Boot ---------------- */
function boot() {
  // load state
  if (load()) renderAll();
  else loadSample();

  // filters
  $("fStatus").addEventListener("change", renderActionsTable);
  $("fOwner").addEventListener("change", renderActionsTable);
  $("fPriority").addEventListener("change", renderActionsTable);

  // buttons
  $("loadSampleBtn").addEventListener("click", loadSample);
  $("randomBtn").addEventListener("click", generateRandom);
  $("resetBtn").addEventListener("click", () => { if (confirm("Reset all data?")) resetAll(); });
  $("regenWeeklyBtn").addEventListener("click", renderWeekly);

  $("copyWeeklyBtn").addEventListener("click", async () => {
    const txt = $("weeklyText").value;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Weekly update copied.");
    } catch {
      alert("Copy failed (browser blocked). You can manually select and copy.");
    }
  });

  // add action
  $("addActionBtn").addEventListener("click", () => {
    openModal("Add Action", [
      { id:"a_title", key:"title", label:"Action", placeholder:"e.g., Confirm requirements sign-off", type:"text" },
      { id:"a_owner", key:"owner", label:"Owner", type:"select", options: owners },
      { id:"a_priority", key:"priority", label:"Priority", type:"select", options: priorities },
      { id:"a_status", key:"status", label:"Status", type:"select", options: statuses },
      { id:"a_due", key:"due", label:"Due date (YYYY-MM-DD)", type:"text", value: isoDatePlus(7) },
      { id:"a_fu", key:"followUp", label:"Follow-up note", type:"text", placeholder:"e.g., Ask for ETA and next steps" },
    ], (data) => {
      state.actions.push({
        title: data.title,
        owner: data.owner,
        priority: data.priority,
        status: data.status,
        due: data.due,
        followUp: data.followUp
      });
      save();
      renderAll();
    });
  });

  // add milestone
  $("addMilestoneBtn").addEventListener("click", () => {
    openModal("Add Milestone", [
      { id:"m_name", key:"name", label:"Milestone name", type:"text", placeholder:"e.g., UAT complete" },
      { id:"m_date", key:"date", label:"Target date (YYYY-MM-DD)", type:"text", value: isoDatePlus(14) },
      { id:"m_prog", key:"progress", label:"Progress (0-100)", type:"text", value:"0" },
    ], (data) => {
      state.milestones.push({ name: data.name, date: data.date, progress: Number(data.progress || 0) });
      save();
      renderAll();
    });
  });

  // add risk
  $("addRiskBtn").addEventListener("click", () => {
    openModal("Add Risk / Issue", [
      { id:"r_rag", key:"rag", label:"RAG", type:"select", options: ["G","A","R"] },
      { id:"r_title", key:"title", label:"Risk / Issue", type:"text", placeholder:"e.g., Dependency not delivered on time" },
      { id:"r_mit", key:"mitigation", label:"Mitigation", type:"textarea", placeholder:"What will you do, and by when?" },
    ], (data) => {
      state.risks.push({ rag: data.rag, title: data.title, mitigation: data.mitigation });
      save();
      renderAll();
    });
  });
}

document.addEventListener("DOMContentLoaded", boot);
