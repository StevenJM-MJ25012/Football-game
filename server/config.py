# config.py
# Equivalente a appsettings.json en .NET
# Cambia estos valores antes de correr el servidor

TIKTOK_USERNAME = "@tu_usuario_aqui"   # El usuario del Live de TikTok

WEBSOCKET_HOST = "localhost"
WEBSOCKET_PORT = 8765

# Cuántos segundos dura cada partido
MATCH_DURATION_SECONDS = 600   # 10 minutos

# Cuántos segundos dura el Modo Fiebre
FEVER_DURATION_SECONDS = 60

# Probabilidad de que el sistema active Fiebre automáticamente (0.0 a 1.0)
FEVER_AUTO_CHANCE = 0.15

# ─── Reglas de regalos ────────────────────────────────────────────────────────
# Cada entrada define cuánto "empuje" o efecto especial da cada regalo.
# "coins"   → valor mínimo de monedas para aplicar esta regla
# "power"   → cuántos metros empuja el balón (porcentaje del campo)
# "effect"  → "push" | "shot" | "goal"
GIFT_RULES = [
    {"coins": 100, "effect": "goal",  "power": 0},    # Cohete, Leon, etc.
    {"coins": 10,  "effect": "shot",  "power": 15},   # Helado, Papa fritas
    {"coins": 1,   "effect": "push",  "power": 4},    # Rosa, Pulgar
]

# ─── Equipos del partido ─────────────────────────────────────────────────────
# Puedes cambiar esto antes de cada partido o hacerlo dinámico más adelante
TEAM_A = {
    "id": "team_a",
    "name": "Argentina",
    "flag": "🇦🇷",
    "color": "#75aadb",
}
TEAM_B = {
    "id": "team_b",
    "name": "Brasil",
    "flag": "🇧🇷",
    "color": "#009c3b",
}
