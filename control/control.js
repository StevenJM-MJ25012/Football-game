const WS_URL = "ws://localhost:8765";

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

let control = {
  socket: null,
  phase: "draw",
  selectedCountries: [],
  tournament: {
    teams: [],
    matches: [],
    currentMatchIdx: 0,
    scoreA: 0,
    scoreB: 0,
    started: false
  }
};

document.addEventListener("DOMContentLoaded", () => {
  buildCountriesGrid();
  connectWebSocket();
});

function connectWebSocket() {
  control.socket = new WebSocket(WS_URL);
  control.socket.onopen = () => {
    console.log("✅ Panel conectado al servidor");
  };
  control.socket.onmessage = (e) => {
    try { handleControlMessage(JSON.parse(e.data)); }
    catch(err) { console.error(err); }
  };
  control.socket.onerror = (err) => console.error("WS Error:", err);
}

function sendMessage(msg) {
  if (control.socket && control.socket.readyState === WebSocket.OPEN) {
    control.socket.send(JSON.stringify(msg));
  }
}

function handleControlMessage(msg) {
  console.log("Mensaje recibido:", msg);
}

function buildCountriesGrid() {
  const grid = document.getElementById("countries-grid");
  grid.innerHTML = "";
  
  COUNTRIES.forEach(country => {
    const card = document.createElement("div");
    card.className = "country-card";
    card.onclick = () => toggleCountry(country);
    card.innerHTML = `
      <div>${country.flag}</div>
      <div class="country-name">${country.name_es}</div>
    `;
    card.id = `country-${country.code}`;
    grid.appendChild(card);
  });
}

function toggleCountry(country) {
  const idx = control.selectedCountries.findIndex(c => c.code === country.code);
  
  if (idx !== -1) {
    control.selectedCountries.splice(idx, 1);
  } else {
    if (control.selectedCountries.length < 16) {
      control.selectedCountries.push(country);
    }
  }
  
  updateCountriesDisplay();
}

function updateCountriesDisplay() {
  COUNTRIES.forEach(country => {
    const card = document.getElementById(`country-${country.code}`);
    const isSelected = control.selectedCountries.some(c => c.code === country.code);
    card.classList.toggle("selected", isSelected);
  });
  
  const btnConfirm = document.getElementById("btn-confirm");
  btnConfirm.disabled = control.selectedCountries.length !== 16;
}

function startDraw() {
  const shuffled = [...COUNTRIES].sort(() => Math.random() - 0.5).slice(0, 16);
  control.selectedCountries = shuffled;
  updateCountriesDisplay();
  alert("🎲 Sorteo completado. Se seleccionaron 16 países aleatoriamente.");
}

function confirmDraw() {
  if (control.selectedCountries.length !== 16) return;
  
  const teams = [...control.selectedCountries].sort(() => Math.random() - 0.5);
  control.tournament.matches = [];
  
  for (let i = 0; i < teams.length; i += 2) {
    control.tournament.matches.push({
      teamA: teams[i],
      teamB: teams[i + 1],
      scoreA: 0,
      scoreB: 0,
      status: "pending"
    });
  }
  
  control.tournament.teams = teams;
  control.phase = "tournament";
  
  document.getElementById("draw-section").style.display = "none";
  document.getElementById("tournament-section").style.display = "flex";
  
  buildMatchesList();
  
  sendMessage({
    type: "tournament_start",
    teams: control.tournament.teams,
    matches: control.tournament.matches
  });
}

function buildMatchesList() {
  const list = document.getElementById("matches-list");
  list.innerHTML = "";
  
  control.tournament.matches.forEach((match, idx) => {
    const item = document.createElement("div");
    item.className = "match-item" + (idx === control.tournament.currentMatchIdx ? " active" : "");
    if (match.status === "finished") item.classList.add("finished");
    
    item.innerHTML = `
      <div class="match-teams">
        <div style="font-weight: 700;">
          <div style="font-size: 20px;">${match.teamA.flag}</div>
          <div style="font-size: 11px;">${match.teamA.name_es}</div>
        </div>
        <div class="team-vs">${match.scoreA || 0} - ${match.scoreB || 0}</div>
        <div style="font-weight: 700;">
          <div style="font-size: 20px;">${match.teamB.flag}</div>
          <div style="font-size: 11px;">${match.teamB.name_es}</div>
        </div>
      </div>
      <div class="match-status${match.status === 'finished' ? ' finished' : ''}">
        ${match.status === 'pending' ? 'Pendiente' : match.status === 'playing' ? 'En vivo' : 'Finalizado'}
      </div>
    `;
    
    item.onclick = () => selectMatch(idx);
    list.appendChild(item);
  });
}

function selectMatch(idx) {
  control.tournament.currentMatchIdx = idx;
  const match = control.tournament.matches[idx];
  
  control.tournament.scoreA = match.scoreA || 0;
  control.tournament.scoreB = match.scoreB || 0;
  
  updateCurrentMatch();
  buildMatchesList();
  
  sendMessage({
    type: "match_selected",
    matchIdx: idx,
    teamA: match.teamA,
    teamB: match.teamB
  });
}

function updateCurrentMatch() {
  const match = control.tournament.matches[control.tournament.currentMatchIdx];
  
  document.getElementById("no-match").style.display = "none";
  document.getElementById("match-content").style.display = "flex";
  
  document.getElementById("current-flag-a").textContent = match.teamA.flag;
  document.getElementById("current-name-a").textContent = match.teamA.name_es;
  document.getElementById("current-name-a2").textContent = match.teamA.name_es;
  document.getElementById("current-score-a").textContent = control.tournament.scoreA;
  
  document.getElementById("current-flag-b").textContent = match.teamB.flag;
  document.getElementById("current-name-b").textContent = match.teamB.name_es;
  document.getElementById("current-name-b2").textContent = match.teamB.name_es;
  document.getElementById("current-score-b").textContent = control.tournament.scoreB;
  
  const statusEl = document.querySelector(".match-status-display");
  if (match.status === "playing") {
    statusEl.textContent = "⏱ En vivo";
  } else if (match.status === "finished") {
    statusEl.textContent = "✅ Finalizado";
  } else {
    statusEl.textContent = "⏸ Pendiente";
  }
}

function addGoal(team) {
  if (team === 'a') {
    control.tournament.scoreA++;
  } else {
    control.tournament.scoreB++;
  }
  
  const match = control.tournament.matches[control.tournament.currentMatchIdx];
  match.scoreA = control.tournament.scoreA;
  match.scoreB = control.tournament.scoreB;
  
  updateCurrentMatch();
  buildMatchesList();
  
  sendMessage({
    type: "score_update",
    matchIdx: control.tournament.currentMatchIdx,
    scoreA: control.tournament.scoreA,
    scoreB: control.tournament.scoreB
  });
}

function removeGoal(team) {
  if (team === 'a' && control.tournament.scoreA > 0) {
    control.tournament.scoreA--;
  } else if (team === 'b' && control.tournament.scoreB > 0) {
    control.tournament.scoreB--;
  }
  
  const match = control.tournament.matches[control.tournament.currentMatchIdx];
  match.scoreA = control.tournament.scoreA;
  match.scoreB = control.tournament.scoreB;
  
  updateCurrentMatch();
  buildMatchesList();
  
  sendMessage({
    type: "score_update",
    matchIdx: control.tournament.currentMatchIdx,
    scoreA: control.tournament.scoreA,
    scoreB: control.tournament.scoreB
  });
}

function startMatch() {
  const match = control.tournament.matches[control.tournament.currentMatchIdx];
  match.status = "playing";
  
  updateCurrentMatch();
  buildMatchesList();
  
  sendMessage({
    type: "match_start",
    matchIdx: control.tournament.currentMatchIdx
  });
}

function finishMatch() {
  const match = control.tournament.matches[control.tournament.currentMatchIdx];
  match.status = "finished";
  
  const winner = control.tournament.scoreA > control.tournament.scoreB ? 
    match.teamA : match.teamB;
  
  updateCurrentMatch();
  buildMatchesList();
  
  sendMessage({
    type: "match_finish",
    matchIdx: control.tournament.currentMatchIdx,
    winner: winner,
    scoreA: control.tournament.scoreA,
    scoreB: control.tournament.scoreB
  });
}