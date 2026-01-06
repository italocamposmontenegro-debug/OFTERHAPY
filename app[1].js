/* Protocolo Orofacial — 100% Local (localStorage) */

const STORAGE_KEY = "protocolo_orofacial_evaluations_v1";
const THEME_KEY = "protocolo_orofacial_theme_v1";

const ITEMS = {
  masticatory: [
    {
      id: "mandibular_depressors",
      title: "Depresores Mandibulares",
      instruction: "Boca Cerrada. Dos Dedos Bajo Mentón. Ejercer Fuerza Hacia Arriba Y Pedir Apertura De Boca."
    },
    {
      id: "mandibular_elevators",
      title: "Elevadores Mandibulares",
      instruction: "Boca Abierta. Dos Dedos En Incisivos Inferiores. Ejercer Fuerza Hacia Abajo Y Pedir Que Cierre La Boca."
    },
    {
      id: "mandibular_protrusors",
      title: "Propulsores Mandibulares",
      instruction: "Pedir Adelantar Mandíbula Con Fuerza Contraria En Mentón."
    },
    {
      id: "mandibular_diductors",
      title: "Diductores Mandibulares",
      instruction: "Pedir Lateralizar Mandíbula Con Fuerza Opuesta En Cuerpo Mandibular."
    }
  ],
  perioral: [
    { id: "orbicularis_oris", title: "Orbicular De Los Labios", instruction: "Instrucción Pendiente (Complete Según Su Protocolo)." },
    { id: "buccinators", title: "Buccinadores", instruction: "Instrucción Pendiente (Complete Según Su Protocolo)." }
  ],
  lingual: [
    { id: "tongue_protrusion", title: "Protrusión Lingual", instruction: "Instrucción Pendiente (Complete Según Su Protocolo)." },
    { id: "tongue_retraction", title: "Retracción Lingual", instruction: "Instrucción Pendiente (Complete Según Su Protocolo)." },
    { id: "tongue_depression", title: "Depresión Lingual", instruction: "Instrucción Pendiente (Complete Según Su Protocolo)." },
    { id: "tongue_elevation", title: "Elevación Lingual", instruction: "Instrucción Pendiente (Complete Según Su Protocolo)." }
  ]
};

const $ = (sel) => document.querySelector(sel);

const els = {
  themeToggle: $("#themeToggle"),
  themeToggleLabel: $("#themeToggleLabel"),

  newEvalBtn: $("#newEvalBtn"),
  exportAllJsonBtn: $("#exportAllJsonBtn"),

  historyList: $("#historyList"),
  historyEmpty: $("#historyEmpty"),

  formTitle: $("#formTitle"),
  evalForm: $("#evalForm"),

  patientName: $("#patientName"),
  patientId: $("#patientId"),
  evalDate: $("#evalDate"),
  context: $("#context"),
  notes: $("#notes"),

  masticatoryItems: $("#masticatoryItems"),
  perioralItems: $("#perioralItems"),
  lingualItems: $("#lingualItems"),

  saveBtn: $("#saveBtn"),
  printBtn: $("#printBtn"),
  exportJsonBtn: $("#exportJsonBtn"),
  exportCsvBtn: $("#exportCsvBtn"),
  deleteBtn: $("#deleteBtn")
};

let state = {
  activeId: null,
  evaluations: []
};

function uid(){
  return "EV-" + Math.random().toString(16).slice(2, 10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
}

function todayISO(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function loadAll(){
  const raw = localStorage.getItem(STORAGE_KEY);
  state.evaluations = raw ? JSON.parse(raw) : [];
}

function persistAll(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.evaluations));
}

function getActive(){
  return state.evaluations.find(e => e.id === state.activeId) || null;
}

function ensureInitial(){
  loadAll();
  renderHistory();
  if(state.evaluations.length > 0){
    openEvaluation(state.evaluations[0].id);
  }else{
    createNew();
  }
}

function renderItems(container, items, scores){
  container.innerHTML = "";
  items.forEach(item => {
    const wrap = document.createElement("div");
    wrap.className = "item";

    const head = document.createElement("div");
    head.className = "item-head";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = item.title;

    const instruction = document.createElement("p");
    instruction.className = "item-instruction";
    instruction.textContent = item.instruction;

    left.appendChild(title);
    left.appendChild(instruction);

    const right = document.createElement("div");
    const select = document.createElement("select");
    select.name = item.id;
    select.dataset.itemId = item.id;

    const opts = [
      { v: "", t: "Seleccione (1–5)" },
      { v: "1", t: "1" },
      { v: "2", t: "2" },
      { v: "3", t: "3" },
      { v: "4", t: "4" },
      { v: "5", t: "5" }
    ];
    opts.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.v;
      opt.textContent = o.t;
      select.appendChild(opt);
    });

    select.value = (scores && scores[item.id]) ? String(scores[item.id]) : "";

    right.appendChild(select);

    head.appendChild(left);
    head.appendChild(right);

    wrap.appendChild(head);

    container.appendChild(wrap);
  });
}

function readScores(){
  const scores = {};
  const selects = els.evalForm.querySelectorAll("select[data-item-id]");
  selects.forEach(s => {
    const v = s.value;
    if(v !== ""){
      scores[s.dataset.itemId] = Number(v);
    }
  });
  return scores;
}

function setFormFromEvaluation(ev){
  els.formTitle.textContent = ev ? "Editar Evaluación" : "Nueva Evaluación";

  els.patientName.value = ev?.patientName || "";
  els.patientId.value = ev?.patientId || "";
  els.evalDate.value = ev?.evalDate || todayISO();
  els.context.value = ev?.context || "";
  els.notes.value = ev?.notes || "";

  renderItems(els.masticatoryItems, ITEMS.masticatory, ev?.scores);
  renderItems(els.perioralItems, ITEMS.perioral, ev?.scores);
  renderItems(els.lingualItems, ITEMS.lingual, ev?.scores);
}

function createBlankEvaluation(){
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patientName: "",
    patientId: "",
    evalDate: todayISO(),
    context: "",
    scores: {},
    notes: ""
  };
}

function createNew(){
  const ev = createBlankEvaluation();
  state.evaluations.unshift(ev);
  state.activeId = ev.id;
  persistAll();
  renderHistory();
  setFormFromEvaluation(ev);
  setActiveInHistory();
}

function openEvaluation(id){
  state.activeId = id;
  const ev = getActive();
  setFormFromEvaluation(ev);
  setActiveInHistory();
}

function renderHistory(){
  const list = els.historyList;
  list.innerHTML = "";

  if(state.evaluations.length === 0){
    els.historyEmpty.style.display = "block";
    return;
  }
  els.historyEmpty.style.display = "none";

  state.evaluations
    .slice()
    .sort((a,b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
    .forEach(ev => {
      const li = document.createElement("li");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = (ev.patientName?.trim() ? ev.patientName.trim() : "Evaluación Sin Nombre");
      btn.addEventListener("click", () => openEvaluation(ev.id));

      const meta = document.createElement("small");
      const date = ev.evalDate || "";
      const ctx = ev.context ? ` • ${ev.context}` : "";
      meta.textContent = `${date}${ctx}`;

      li.dataset.evalId = ev.id;
      li.appendChild(btn);
      li.appendChild(meta);

      list.appendChild(li);
    });
}

function setActiveInHistory(){
  const nodes = els.historyList.querySelectorAll("li");
  nodes.forEach(n => {
    const isActive = n.dataset.evalId === state.activeId;
    n.style.borderColor = isActive ? "rgba(212,175,55,0.55)" : "var(--border)";
    n.style.boxShadow = isActive ? "0 0 0 4px rgba(212,175,55,0.12)" : "none";
  });
}

function saveActive(){
  const ev = getActive();
  if(!ev) return;

  ev.patientName = els.patientName.value || "";
  ev.patientId = els.patientId.value || "";
  ev.evalDate = els.evalDate.value || todayISO();
  ev.context = els.context.value || "";
  ev.notes = els.notes.value || "";
  ev.scores = readScores();
  ev.updatedAt = new Date().toISOString();

  persistAll();
  renderHistory();
  setActiveInHistory();
}

function deleteActive(){
  const ev = getActive();
  if(!ev) return;

  const ok = confirm("¿Eliminar Esta Evaluación? Esta Acción No Se Puede Deshacer.");
  if(!ok) return;

  state.evaluations = state.evaluations.filter(e => e.id !== ev.id);
  persistAll();
  renderHistory();

  if(state.evaluations.length > 0){
    openEvaluation(state.evaluations[0].id);
  }else{
    createNew();
  }
}

function download(filename, content, mime="application/octet-stream"){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportActiveJson(){
  const ev = getActive();
  if(!ev) return;
  download(`evaluacion_${ev.id}.json`, JSON.stringify(ev, null, 2), "application/json");
}

function exportAllJson(){
  download("evaluaciones_todas.json", JSON.stringify(state.evaluations, null, 2), "application/json");
}

function exportActiveCsv(){
  const ev = getActive();
  if(!ev) return;

  const itemOrder = [
    ...ITEMS.masticatory,
    ...ITEMS.perioral,
    ...ITEMS.lingual
  ];

  const headers = [
    "Id",
    "Fecha",
    "Nombre",
    "Identificador",
    "Contexto",
    ...itemOrder.map(i => i.title),
    "Notas"
  ];

  const row = [
    ev.id,
    ev.evalDate || "",
    (ev.patientName || "").replaceAll("\n"," ").trim(),
    (ev.patientId || "").replaceAll("\n"," ").trim(),
    (ev.context || "").replaceAll("\n"," ").trim(),
    ...itemOrder.map(i => (ev.scores && ev.scores[i.id] != null) ? String(ev.scores[i.id]) : ""),
    (ev.notes || "").replaceAll("\n"," ").trim()
  ];

  const csv = [
    headers.map(escapeCsv).join(","),
    row.map(escapeCsv).join(",")
  ].join("\n");

  download(`evaluacion_${ev.id}.csv`, csv, "text/csv;charset=utf-8");
}

function escapeCsv(value){
  const v = String(value ?? "");
  if(/[",\n]/.test(v)){
    return `"${v.replaceAll('"','""')}"`;
  }
  return v;
}

function buildReportHtml(ev){
  const itemGroups = [
    { name: "Músculos Masticatorios", items: ITEMS.masticatory },
    { name: "Músculos Peribucales", items: ITEMS.perioral },
    { name: "Músculos Linguales", items: ITEMS.lingual }
  ];

  const rows = itemGroups.map(g => {
    const inner = g.items.map(i => {
      const score = (ev.scores && ev.scores[i.id] != null) ? ev.scores[i.id] : "—";
      return `
        <tr>
          <td class="title">${escapeHtml(i.title)}</td>
          <td class="score">${escapeHtml(String(score))}</td>
          <td class="inst">${escapeHtml(i.instruction)}</td>
        </tr>
      `;
    }).join("");

    return `
      <h3>${escapeHtml(g.name)}</h3>
      <table>
        <thead>
          <tr>
            <th>Ítem</th>
            <th>Puntaje</th>
            <th>Instrucción</th>
          </tr>
        </thead>
        <tbody>${inner}</tbody>
      </table>
    `;
  }).join("");

  const header = `
    <h1>Protocolo Orofacial</h1>
    <p><strong>Fecha:</strong> ${escapeHtml(ev.evalDate || "")}</p>
    <p><strong>Usuario/a:</strong> ${escapeHtml(ev.patientName || "")}</p>
    <p><strong>Identificador:</strong> ${escapeHtml(ev.patientId || "")}</p>
    <p><strong>Contexto:</strong> ${escapeHtml(ev.context || "")}</p>
    <hr />
  `;

  const notes = `
    <h3>Observaciones</h3>
    <p class="notes">${escapeHtml(ev.notes || "") || "—"}</p>
  `;

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Reporte ${escapeHtml(ev.id)}</title>
      <style>
        body{ font-family: Arial, Helvetica, sans-serif; margin: 22px; color: #111; }
        h1{ margin: 0 0 10px; }
        h3{ margin: 18px 0 8px; }
        p{ margin: 6px 0; }
        hr{ margin: 14px 0; }
        table{ width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td{ border: 1px solid #ddd; padding: 8px; vertical-align: top; font-size: 12px; }
        th{ background: #f4f4f4; text-align: left; }
        td.score{ width: 70px; text-align: center; font-weight: bold; }
        td.title{ width: 260px; }
        .notes{ white-space: pre-wrap; }
      </style>
    </head>
    <body>
      ${header}
      ${rows}
      ${notes}
      <script>
        window.onload = () => { window.print(); };
      </script>
    </body>
    </html>
  `;
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function printActive(){
  const ev = getActive();
  if(!ev) return;
  // Guardar Antes De Imprimir Para Capturar Últimos Cambios
  saveActive();

  const fresh = getActive();
  const html = buildReportHtml(fresh);
  const w = window.open("", "_blank");
  if(!w){
    alert("No Se Pudo Abrir La Ventana De Impresión. Revise El Bloqueo De Popups.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  const isLight = theme === "light";
  els.themeToggleLabel.textContent = isLight ? "Modo Día" : "Modo Noche";
  $(".dot").style.background = isLight ? "var(--purple)" : "var(--gold)";
}

function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  setTheme(saved || "dark");
}

function wireEvents(){
  els.newEvalBtn.addEventListener("click", () => createNew());
  els.saveBtn.addEventListener("click", () => saveActive());
  els.deleteBtn.addEventListener("click", () => deleteActive());

  els.exportJsonBtn.addEventListener("click", () => exportActiveJson());
  els.exportAllJsonBtn.addEventListener("click", () => exportAllJson());
  els.exportCsvBtn.addEventListener("click", () => exportActiveCsv());
  els.printBtn.addEventListener("click", () => printActive());

  els.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "light" ? "dark" : "light");
  });
}

function registerServiceWorker(){
  if("serviceWorker" in navigator){
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}

(function init(){
  initTheme();
  wireEvents();
  registerServiceWorker();
  ensureInitial();
})();
