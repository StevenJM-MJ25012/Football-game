const WS_URL = "ws://localhost:8765";

// Países disponibles
const COUNTRIES = [
  { code: "AR", name_es: "Argentina", name_en: "Argentina", flag: "🇦🇷" },
  { code: "BR", name_es: "Brasil", name_en: "Brazil", flag: "🇧🇷" },
  { code: "ES", name_es: "España", name_en: "Spain", flag: "🇪🇸" },
  { code: "IT", name_es: "Italia", name_en: "Italy", flag: "🇮🇹" },
  { code: "FR", name_es: "Francia", name_en: "France", flag: "🇫🇷" },
  { code: "DE", name_es: "Alemania", name_en: "Germany", flag: "🇩🇪" },
  { code: "PT", name_es: "Portugal", name_en: "Portugal", flag: "🇵🇹" },
  { code: "MX", name_es: "México", name_en: "Mexico", flag: "🇲🇽" },
  { code: "CO", name_es: "Colombia", name_en: "Colombia", flag: "🇨🇴" },
  { code: "PE", name_es: "Perú", name_en: "Peru", flag: "🇵🇪" },
  { code: "CL", name_es: "Chile", name_en: "Chile", flag: "🇨🇱" },
  { code: "US", name_es: "USA", name_en: "USA", flag: "🇺🇸" },
  { code: "EN", name_es: "Inglaterra", name_en: "England", flag: "🇬🇧" },
  { code: "NL", name_es: "Holanda", name_en: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name_es: "Bélgica", name_en: "Belgium", flag: "🇧🇪" },
  { code: "JP", name_es: "Japón", name_en: "Japan", flag: "🇯🇵" },
];

// Estado global
let state = {
  currentLang: "es",
  socket: null,
  timeLeft: 600,
  timerInterval: null,
  teamA: null,
  teamB: null,
  tournament: {
    teams: [],
    matches: [],
    currentRound: "16avos",
    currentMatchIdx: 0,
    winners: []
  }
};

// Posiciones base de jugadores
const BASE_POSITIONS = {
  gk_a: { x: 92, y: 50 }, gk_b: { x: 8, y: 50 },
  f_a1: { x: 30, y: 30 }, f_a2: { x: 35, y: 60 }, f_a3: { x: 55, y: 45 },
  f_b1: { x: 70, y: 30 }, f_b2: { x: 65, y: 60 }, f_b3: { x: 45, y: 55 },
};

const PLAYER_CONFIGS = [
  { id:"gk_a", team:"team_a", isGK:true, shirt:"🧤" },
  { id:"gk_b", team:"team_b", isGK:true, shirt:"🧤" },
  { id:"f_a1", team:"team_a", isGK:false, shirt:"👕" },
  { id:"f_a2", team:"team_a", isGK:false, shirt:"👕" },
  { id:"f_a3", team:"team_a", isGK:false, shirt:"👕" },
  { id:"f_b1", team:"team_b", isGK:false, shirt:"👕" },
  { id:"f_b2", team:"team_b", isGK:false, shirt:"👕" },
  { id:"f_b3", team:"team_b", isGK:false, shirt:"👕" },
];

const FAN_EMOJIS = ["🙌","🙋","🧣","📣","👏","🎉","🎊","🤩","✨","⚽"];

// ─── FUNCIONES DE IDIOMA ─────────────────────────────────────
window.setLanguage = function(lang) {
  state.currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.classList.toggle('lang-en', lang === 'en');
  document.documentElement.classList.toggle('lang-es', lang === 'es');
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  updateTeamNames();
};

function getText(es, en) {
  return state.currentLang === 'es' ? es : en;
}

function updateTeamNames() {
  if (!state.teamA || !state.teamB) return;
  document.getElementById("name-a").textContent = state.currentLang === 'es' ? state.teamA.name_es : state.teamA.name_en;
  document.getElementById("name-b").textContent = state.currentLang === 'es' ? state.teamB.name_es : state.teamB.name_en;
  document.getElementById("mvp-a-label").textContent = '🏆 ' + getText('Rey de ', 'Champion: ') + (state.currentLang === 'es' ? state.teamA.name_es : state.teamA.name_en);
  document.getElementById("mvp-b-label").textContent = '🏆 ' + getText('Rey de ', 'Champion: ') + (state.currentLang === 'es' ? state.teamB.name_es : state.teamB.name_en);
}

// ─── GRADAS ───────────────────────────────────────────────────
function buildStands() {
  const leftSection = document.querySelector(".stands-section.left");
  const rightSection = document.querySelector(".stands-section.right");
  leftSection.innerHTML = "";
  rightSection.innerHTML = "";
  
  const fansPerSide = 40;
  for (let i = 0; i < fansPerSide; i++) {
    leftSection.appendChild(createFanElement(state.teamA.flag, i));
    rightSection.appendChild(createFanElement(state.teamB.flag, fansPerSide + i));
  }
}

function createFanElement(flagOrEmoji, id) {
  const span = document.createElement("span");
  span.className = "fan";
  span.id = "fan-" + id;
  span.textContent = Math.random() > 0.5 ? flagOrEmoji : FAN_EMOJIS[Math.floor(Math.random() * FAN_EMOJIS.length)];
  span.style.setProperty("--delay", (Math.random() * 2) + "s");
  span.style.setProperty("--sway", (Math.random() > 0.5 ? "" : "-") + Math.floor(Math.random()*10+4) + "deg");
  span.style.fontSize = (20 + Math.floor(Math.random()*6)) + "px";
  return span;
}

function celebrateFans(teamId) {
  const isA = teamId === "team_a";
  const total = 80;
  const start = isA ? 0 : 40;
  const end = isA ? 40 : 80;
  for (let i = start; i < end; i++) {
    const el = document.getElementById("fan-" + i);
    if (!el) continue;
    el.classList.add("celebrate");
    setTimeout(() => el.classList.remove("celebrate"), 3000);
  }
}

// ─── JUGADORES ─────────────────────────────────────────────────
function buildPlayers() {
  PLAYER_CONFIGS.forEach(cfg => {
    if (document.getElementById("player-" + cfg.id)) return;
    const div = document.createElement("div");
    div.className = "player" + (cfg.isGK ? " goalkeeper" : "");
    div.id = "player-" + cfg.id;
    const shirt = cfg.team === "team_a" ? (cfg.isGK ? "🟧" : "🟦") : (cfg.isGK ? "🟫" : "🟨");
    div.innerHTML = `<div class="player-body">${shirt}</div><div class="player-name" id="plabel-${cfg.id}"></div>`;
    document.getElementById("field").appendChild(div);
  });
  updateAllPlayerPositions();
}

function getFieldDims() {
  const wrapper = document.getElementById("field-wrapper");
  return { w: wrapper.clientWidth, h: wrapper.clientHeight };
}

function placePlayer(id, xPct, yPct) {
  const el = document.getElementById("player-" + id);
  if (!el) return;
  const { w, h } = getFieldDims();
  el.style.left = (xPct / 100 * w - 14) + "px";
  el.style.top = (yPct / 100 * h - 16) + "px";
}

function updateAllPlayerPositions() {
  Object.entries(BASE_POSITIONS).forEach(([id, pos]) => {
    placePlayer(id, pos.x, pos.y);
  });
}

function moveGoalkeepers(ballY) {
  const clampedY = Math.max(20, Math.min(80, ballY));
  BASE_POSITIONS.gk_a.y = clampedY;
  placePlayer("gk_a", BASE_POSITIONS.gk_a.x, clampedY);
  BASE_POSITIONS.gk_b.y = clampedY;
  placePlayer("gk_b", BASE_POSITIONS.gk_b.x, clampedY);
}

function reactNearbyPlayers(ballX, ballY) {
  const fieldPlayers = ["f_a1","f_a2","f_a3","f_b1","f_b2","f_b3"];
  fieldPlayers.forEach(id => {
    const pos = BASE_POSITIONS[id];
    const dist = Math.sqrt(Math.pow(ballX - pos.x, 2) + Math.pow(ballY - pos.y, 2));
    if (dist < 18) {
      const el = document.getElementById("player-" + id);
      if (el) {
        el.classList.add("react");
        setTimeout(() => el.classList.remove("react"), 500);
        pos.x += (ballX - pos.x) * 0.15;
        pos.y += (ballY - pos.y) * 0.15;
        placePlayer(id, pos.x, pos.y);
      }
    }
  });
}

function showDonorOnPlayer(username, teamId, ballX, ballY) {
  const ids = teamId === "team_a" ? ["f_a1","f_a2","f_a3"] : ["f_b1","f_b2","f_b3"];
  let closest = ids[0], minDist = Infinity;
  ids.forEach(id => {
    const pos = BASE_POSITIONS[id];
    const d = Math.sqrt(Math.pow(ballX - pos.x,2) + Math.pow(ballY - pos.y,2));
    if (d < minDist) { minDist = d; closest = id; }
  });
  const label = document.getElementById("plabel-" + closest);
  if (label) {
    label.textContent = username;
    setTimeout(() => { label.textContent = ""; }, 3500);
  }
}

function resetPlayerPositions() {
  Object.keys(BASE_POSITIONS).forEach(id => {
    const orig = {
      gk_a:{x:92,y:50}, gk_b:{x:8,y:50},
      f_a1:{x:30,y:30}, f_a2:{x:35,y:60}, f_a3:{x:55,y:45},
      f_b1:{x:70,y:30}, f_b2:{x:65,y:60}, f_b3:{x:45,y:55},
    };
    BASE_POSITIONS[id].x = orig[id].x;
    BASE_POSITIONS[id].y = orig[id].y;
    placePlayer(id, orig[id].x, orig[id].y);
  });
}

// ─── BALÓN ──────────────────────────────────────────────────────
function moveBall(xPct, yPct) {
  const { w, h } = getFieldDims();
  const ball = document.getElementById("ball");
  ball.style.left = (xPct / 100 * w) + "px";
  ball.style.top = (yPct / 100 * h) + "px";
  moveGoalkeepers(yPct);
  reactNearbyPlayers(xPct, yPct);
}

function kickBallAnim() {
  const ball = document.getElementById("ball");
  ball.classList.add("kicked");
  setTimeout(() => ball.classList.remove("kicked"), 550);
}

function updateGoalFlags() {
  document.getElementById("flag-goal-left-t").textContent = state.teamB.flag;
  document.getElementById("flag-goal-left-b").textContent = state.teamB.flag;
  document.getElementById("flag-goal-right-t").textContent = state.teamA.flag;
  document.getElementById("flag-goal-right-b").textContent = state.teamA.flag;
  document.getElementById("banner-left").textContent = state.teamB.flag;
  document.getElementById("banner-right").textContent = state.teamA.flag;
}

// ─── WEBSOCKET ──────────────────────────────────────────────────
function connect() {
  state.socket = new WebSocket(WS_URL);
  state.socket.onopen = () => {
    setStatus("connected", getText("Conectado", "Connected"));
    addFeed(getText("✅ Overlay listo.", "✅ Overlay ready."));
  };
  state.socket.onmessage = (e) => {
    try { handleMessage(JSON.parse(e.data)); }
    catch(err) { console.error(err); }
  };
  state.socket.onclose = () => {
    setStatus("disconnected", getText("Sin conexión", "No connection"));
    clearInterval(state.timerInterval);
    setTimeout(connect, 3000);
  };
}

function handleMessage(msg) {
  // Match selected desde el panel
  if (msg.type === "match_selected") {
    state.teamA = msg.teamA;
    state.teamB = msg.teamB;
    document.getElementById("score-a").textContent = "0";
    document.getElementById("score-b").textContent = "0";
    updateTeamNames();
    updateGoalFlags();
    buildStands();
    resetPlayerPositions();
    moveBall(50, 50);
    state.timeLeft = 600;
    startTimer();
  }

  // Score update
  if (msg.type === "score_update") {
    document.getElementById("score-a").textContent = msg.scoreA || 0;
    document.getElementById("score-b").textContent = msg.scoreB || 0;
  }

  // Movimiento del balón
  if (msg.ball_x !== undefined) {
    moveBall(msg.ball_x, msg.ball_y);
    if (msg.type === "shot" || msg.type === "goal") kickBallAnim();
  }

  if (msg.username && msg.team_id) {
    showDonorOnPlayer(msg.username, msg.team_id, msg.ball_x, msg.ball_y);
  }

  if (msg.fever_triggered) activateFever();
  if (!msg.fever) {
    document.getElementById("fever-badge").classList.remove("active");
    document.getElementById("fever-border").classList.remove("active");
  }

  if (msg.type === "goal") {
    const tName_es = msg.team_id === "team_a" ? state.teamA.name_es : state.teamB.name_es;
    const tName_en = msg.team_id === "team_a" ? state.teamA.name_en : state.teamB.name_en;
    const tName = state.currentLang === 'es' ? tName_es : tName_en;
    const tFlag = msg.team_id === "team_a" ? state.teamA.flag : state.teamB.flag;

    flashGoal(tName, tFlag, msg.username);
    flashScore(msg.team_id);
    celebrateFans(msg.team_id);
    resetPlayerPositions();
    const goalMsg = getText(`⚽ <b>GOL de ${tName}!</b> ${msg.username}`, `⚽ <b>GOAL by ${tName}!</b> ${msg.username}`);
    addFeed(goalMsg, true);
  }
}

// ─── UI HELPERS ─────────────────────────────────────────────────
function flashGoal(teamName, teamFlag, username) {
  const flash = document.getElementById("goal-flash");
  document.getElementById("goal-text").innerHTML = `⚽ <span class="text-es">GOL!</span><span class="text-en">GOAL!</span>`;
  document.getElementById("goal-sub").textContent = teamName + " " + getText("anota", "scores");
  document.getElementById("goal-user").textContent = getText("Gracias a ", "Thanks to ") + username;
  flash.classList.add("show");
  setTimeout(() => flash.classList.remove("show"), 2800);
}

function flashScore(teamId) {
  const el = document.getElementById(teamId === "team_a" ? "score-a" : "score-b");
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 900);
}

function activateFever() {
  document.getElementById("fever-badge").classList.add("active");
  document.getElementById("fever-border").classList.add("active");
  addFeed(getText("⚡ FIEBRE — regalos x2!", "⚡ FEVER — gifts x2!"), true);
}

function addFeed(html, hl=false) {
  const feed = document.getElementById("feed");
  const div = document.createElement("div");
  div.className = "feed-msg" + (hl ? " hl" : "");
  div.innerHTML = html;
  feed.appendChild(div);
  while (feed.children.length > 3) feed.removeChild(feed.firstChild);
}

function setStatus(stat, label) {
  document.getElementById("ws-dot").className = stat;
  document.getElementById("ws-label").textContent = label;
}

function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      document.getElementById("timer").textContent = getText("FIN", "END");
      return;
    }
    state.timeLeft--;
    const m = Math.floor(state.timeLeft/60).toString().padStart(2,"0");
    const s = (state.timeLeft%60).toString().padStart(2,"0");
    document.getElementById("timer").textContent = m+":"+s;
  }, 1000);
}

// ─── INIT ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  buildPlayers();
  moveBall(50, 50);
  connect();
  
  window.addEventListener("resize", () => {
    updateAllPlayerPositions();
    moveBall(50, 50);
  });
});