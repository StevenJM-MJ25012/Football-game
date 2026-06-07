# control_panel.py
# Panel de control web — abre http://localhost:8766 en tu navegador.
# Permite enviar regalos manualmente para probar el overlay sin TikTok.
# Equivalente a un Controller en .NET con una vista Razor mínima.

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import asyncio
from gift_processor import process_gift, game_state
from config import TEAM_A, TEAM_B

PANEL_PORT = 8766

# Referencia al event loop principal (se inyecta desde main.py)
_main_loop: asyncio.AbstractEventLoop = None
_broadcast_fn = None

def set_loop_and_broadcast(loop, broadcast_fn):
    global _main_loop, _broadcast_fn
    _main_loop = loop
    _broadcast_fn = broadcast_fn


class PanelHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        pass  # Silencia los logs de HTTP para no ensuciar la consola

    def _send_json(self, data: dict, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html: str):
        body = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/":
            self._send_html(PANEL_HTML)

        elif parsed.path == "/state":
            self._send_json({
                "score_a": game_state.score_a,
                "score_b": game_state.score_b,
                "ball_x": game_state.ball_x,
                "ball_y": game_state.ball_y,
                "fever": game_state.is_fever_active(),
                "mvp_a": game_state.mvp["team_a"],
                "mvp_b": game_state.mvp["team_b"],
                "team_a": TEAM_A,
                "team_b": TEAM_B,
            })

        elif parsed.path == "/gift":
            params = parse_qs(parsed.query)
            username  = params.get("user",  ["@tester"])[0]
            gift_name = params.get("gift",  ["Rosa"])[0]
            coins     = int(params.get("coins", ["1"])[0])
            team_id   = params.get("team",  ["team_a"])[0]

            action = process_gift(username, gift_name, coins, team_id)
            action["team_a"] = TEAM_A
            action["team_b"] = TEAM_B

            # Envía el broadcast al event loop asíncrono desde este hilo síncrono
            if _main_loop and _broadcast_fn:
                asyncio.run_coroutine_threadsafe(_broadcast_fn(action), _main_loop)

            self._send_json({"ok": True, "action": action})

        elif parsed.path == "/fever":
            game_state.activate_fever()
            action = {
                "type": "push",
                "team_id": "team_a",
                "username": "@panel",
                "gift_name": "Fiebre Manual",
                "coins": 0,
                "multiplier": 2,
                "ball_x": game_state.ball_x,
                "ball_y": game_state.ball_y,
                "score_a": game_state.score_a,
                "score_b": game_state.score_b,
                "mvp_a": game_state.mvp["team_a"],
                "mvp_b": game_state.mvp["team_b"],
                "mvp_dethroned": None,
                "fever": True,
                "fever_triggered": True,
                "team_a": TEAM_A,
                "team_b": TEAM_B,
            }
            if _main_loop and _broadcast_fn:
                asyncio.run_coroutine_threadsafe(_broadcast_fn(action), _main_loop)
            self._send_json({"ok": True, "fever": True})

        elif parsed.path == "/reset":
            game_state.score_a = 0
            game_state.score_b = 0
            game_state.reset_ball()
            game_state.donations.clear()
            game_state.mvp = {
                "team_a": {"user": None, "coins": 0},
                "team_b": {"user": None, "coins": 0},
            }
            action = {
                "type": "system",
                "message": "Partido reiniciado desde el panel",
                "score_a": 0, "score_b": 0,
                "ball_x": 50, "ball_y": 50,
                "fever": False, "fever_triggered": False,
                "mvp_a": game_state.mvp["team_a"],
                "mvp_b": game_state.mvp["team_b"],
                "mvp_dethroned": None,
                "multiplier": 1,
                "team_a": TEAM_A, "team_b": TEAM_B,
            }
            if _main_loop and _broadcast_fn:
                asyncio.run_coroutine_threadsafe(_broadcast_fn(action), _main_loop)
            self._send_json({"ok": True, "reset": True})

        else:
            self.send_response(404)
            self.end_headers()


PANEL_HTML = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Panel de Control — TikTok Football</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 24px; }
h1 { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 4px; }
p.sub { font-size: 12px; color: #666; margin-bottom: 24px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 720px; }
.card {
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px;
  padding: 16px;
}
.card h2 { font-size: 13px; color: #888; font-weight: 500; margin-bottom: 12px; letter-spacing: 0.5px; }
label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; margin-top: 10px; }
input, select {
  width: 100%; padding: 7px 10px; border-radius: 6px;
  border: 1px solid #333; background: #111; color: #e0e0e0;
  font-size: 13px;
}
button {
  margin-top: 12px; width: 100%; padding: 9px;
  background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px;
  color: #fff; font-size: 13px; cursor: pointer; transition: background 0.15s;
}
button:hover { background: #3a3a3a; }
button.primary { background: #1a4a1a; border-color: #2a6a2a; color: #6fe06f; }
button.primary:hover { background: #256025; }
button.danger { background: #3a1a1a; border-color: #6a2a2a; color: #e06f6f; }
button.danger:hover { background: #5a2020; }
button.fever { background: #3a1a00; border-color: #884400; color: #ff9933; }
button.fever:hover { background: #552200; }
.scoreboard {
  display: flex; align-items: center; justify-content: center;
  gap: 20px; margin: 12px 0; font-size: 28px; font-weight: 700; color: #fff;
}
.team-label { font-size: 12px; color: #666; text-align: center; }
.gift-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 8px; }
.gift-quick {
  padding: 7px 4px; border-radius: 6px; border: 1px solid #2a2a2a;
  background: #111; color: #ccc; font-size: 12px; cursor: pointer;
  text-align: center; transition: background 0.15s;
}
.gift-quick:hover { background: #222; }
.status { font-size: 11px; color: #555; margin-top: 8px; min-height: 16px; }
.full { grid-column: 1 / -1; }
</style>
</head>
<body>
<h1>Panel de Control — TikTok Football</h1>
<p class="sub">Envía regalos de prueba al overlay. El overlay debe estar abierto en otra pestaña.</p>

<div class="grid">
  <!-- Marcador en vivo -->
  <div class="card full">
    <h2>ESTADO DEL PARTIDO</h2>
    <div class="scoreboard">
      <div>
        <div class="team-label" id="name-a">Argentina</div>
        <div id="live-score-a">0</div>
      </div>
      <div style="color:#444; font-size:20px">VS</div>
      <div>
        <div class="team-label" id="name-b">Brasil</div>
        <div id="live-score-b">0</div>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="fever" onclick="activateFever()">⚡ Activar Modo Fiebre</button>
      <button class="danger" onclick="resetMatch()">↺ Reiniciar Partido</button>
    </div>
    <div class="status" id="status-main"></div>
  </div>

  <!-- Regalo manual -->
  <div class="card">
    <h2>ENVIAR REGALO MANUAL</h2>
    <label>Usuario</label>
    <input type="text" id="username" value="@tester_pro" />
    <label>Equipo</label>
    <select id="team">
      <option value="team_a">Argentina 🇦🇷</option>
      <option value="team_b">Brasil 🇧🇷</option>
    </select>
    <label>Regalo</label>
    <input type="text" id="gift-name" value="Rosa" />
    <label>Monedas</label>
    <input type="number" id="coins" value="1" min="1" />
    <button class="primary" onclick="sendGift()">Enviar Regalo</button>
    <div class="status" id="status-gift"></div>
  </div>

  <!-- Regalos rápidos -->
  <div class="card">
    <h2>REGALOS RÁPIDOS</h2>
    <label>Equipo destino</label>
    <select id="quick-team">
      <option value="team_a">Argentina 🇦🇷</option>
      <option value="team_b">Brasil 🇧🇷</option>
    </select>
    <div class="gift-grid">
      <button class="gift-quick" onclick="quickGift('Rosa',1)">🌹 Rosa<br><span style='color:#555'>1🪙</span></button>
      <button class="gift-quick" onclick="quickGift('Helado',10)">🍦 Helado<br><span style='color:#555'>10🪙</span></button>
      <button class="gift-quick" onclick="quickGift('Papa Fritas',15)">🍟 Papas<br><span style='color:#555'>15🪙</span></button>
      <button class="gift-quick" onclick="quickGift('Drama Queen',50)">👑 Drama<br><span style='color:#555'>50🪙</span></button>
      <button class="gift-quick" onclick="quickGift('Cohete',100)" style="border-color:#553">🚀 Cohete<br><span style='color:#aa8'>100🪙</span></button>
      <button class="gift-quick" onclick="quickGift('Leon',500)" style="border-color:#533">🦁 Leon<br><span style='color:#a88'>500🪙</span></button>
    </div>
    <div class="status" id="status-quick"></div>
  </div>
</div>

<script>
async function fetchState() {
  try {
    const r = await fetch('/state');
    const d = await r.json();
    document.getElementById('live-score-a').textContent = d.score_a;
    document.getElementById('live-score-b').textContent = d.score_b;
    if (d.team_a) document.getElementById('name-a').textContent = d.team_a.name + ' ' + d.team_a.flag;
    if (d.team_b) document.getElementById('name-b').textContent = d.team_b.name + ' ' + d.team_b.flag;
  } catch(e) {}
}

async function sendGift() {
  const user  = document.getElementById('username').value;
  const team  = document.getElementById('team').value;
  const gift  = document.getElementById('gift-name').value;
  const coins = document.getElementById('coins').value;
  const r = await fetch(`/gift?user=${encodeURIComponent(user)}&gift=${encodeURIComponent(gift)}&coins=${coins}&team=${team}`);
  const d = await r.json();
  document.getElementById('status-gift').textContent = d.ok ? '✓ Enviado — ' + d.action.type : '✗ Error';
  fetchState();
}

async function quickGift(giftName, coins) {
  const team = document.getElementById('quick-team').value;
  const user = team === 'team_a' ? '@fan_arg' : '@fan_bra';
  const r = await fetch(`/gift?user=${encodeURIComponent(user)}&gift=${encodeURIComponent(giftName)}&coins=${coins}&team=${team}`);
  const d = await r.json();
  document.getElementById('status-quick').textContent = '✓ ' + giftName + ' enviado → ' + d.action.type;
  fetchState();
}

async function activateFever() {
  await fetch('/fever');
  document.getElementById('status-main').textContent = '⚡ Modo Fiebre activado por 60 segundos';
}

async function resetMatch() {
  await fetch('/reset');
  document.getElementById('status-main').textContent = '↺ Partido reiniciado';
  fetchState();
}

fetchState();
setInterval(fetchState, 2000);
</script>
</body>
</html>
"""


def start_panel():
    """Inicia el servidor HTTP del panel en un hilo separado."""
    server = HTTPServer(("localhost", PANEL_PORT), PanelHandler)
    print(f"[Panel] Panel de control en http://localhost:{PANEL_PORT}")
    server.serve_forever()
