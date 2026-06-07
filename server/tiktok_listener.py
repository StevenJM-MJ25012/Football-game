# tiktok_listener.py
# MODO SIMULACIÓN — No requiere TikTok Live ni seguidores.
# Simula regalos aleatorios para que puedas probar el overlay completo.
# Cuando tengas 1000 seguidores, reemplaza este archivo por tiktok_listener_live.py

import asyncio
import random
from gift_processor import process_gift
from websocket_server import broadcast
from config import TEAM_A, TEAM_B

# Regalos simulados: (nombre, monedas, probabilidad relativa)
SIMULATED_GIFTS = [
    ("Rosa",         1,   50),
    ("Pulgar",       1,   40),
    ("Helado",       10,  20),
    ("Papa Fritas",  15,  15),
    ("Drama Queen",  50,   8),
    ("Cohete",       100,  4),
    ("Leon",         500,  1),
]

# Usuarios ficticios por equipo
FAKE_USERS_A = [
    "@rodrigo_arg", "@pato_boca", "@messi_fan10",
    "@albiceleste99", "@buenos_aires_fc", "@leonel_1978",
]
FAKE_USERS_B = [
    "@canarinha99", "@neymar_lover", "@verde_amarelo",
    "@samba_brasil", "@rio_2026", "@hexa_campeao",
]

def _pick_gift() -> tuple[str, int]:
    """Elige un regalo al azar con probabilidad ponderada."""
    total = sum(g[2] for g in SIMULATED_GIFTS)
    r = random.randint(0, total - 1)
    acc = 0
    for name, coins, weight in SIMULATED_GIFTS:
        acc += weight
        if r < acc:
            return name, coins
    return SIMULATED_GIFTS[0][0], SIMULATED_GIFTS[0][1]

async def start_listener():
    """
    Simula un stream de regalos aleatorios cada 2-6 segundos.
    Reemplaza esto con tiktok_listener_live.py cuando tengas el Live activo.
    """
    print("[SIMULADOR] Modo de prueba activo — simulando regalos cada 2-6 segundos")
    print("[SIMULADOR] Abre el panel en http://localhost:8766 para enviar regalos manualmente")

    await broadcast({
        "type": "system",
        "message": "Modo simulación activo — regalos automáticos cada pocos segundos",
    })

    while True:
        await asyncio.sleep(random.uniform(2, 6))

        # Elige equipo al azar (60% team_a para que haya más tensión)
        team_id = "team_a" if random.random() < 0.6 else "team_b"
        users = FAKE_USERS_A if team_id == "team_a" else FAKE_USERS_B
        username = random.choice(users)
        gift_name, coins = _pick_gift()

        print(f"[SIMULADOR] {username} → {gift_name} ({coins} monedas) para {team_id}")

        action = process_gift(username, gift_name, coins, team_id)
        action["team_a"] = TEAM_A
        action["team_b"] = TEAM_B

        await broadcast(action)
