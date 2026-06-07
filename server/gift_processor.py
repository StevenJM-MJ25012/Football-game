# gift_processor.py
# Lógica de negocio pura — traduce un regalo de TikTok en una acción del juego.
# No sabe nada de WebSockets ni de TikTok. Solo recibe datos y devuelve acciones.
# Equivalente a un Service en la arquitectura de .NET.

import random
import time
from config import GIFT_RULES, FEVER_DURATION_SECONDS, FEVER_AUTO_CHANCE


class GameState:
    """
    Estado global del partido. Equivale a un Singleton con el estado en memoria.
    En el futuro esto puede moverse a Redis o una base de datos.
    """
    def __init__(self):
        self.score_a = 0
        self.score_b = 0
        self.ball_x = 50.0      # Posición horizontal del balón (0-100%)
        self.ball_y = 50.0      # Posición vertical del balón (0-100%)
        self.fever_active = False
        self.fever_ends_at = 0.0

        # Diccionario: usuario → total de monedas donadas en este partido
        self.donations: dict[str, int] = {}

        # MVP por equipo: { "team_a": {"user": "@nombre", "coins": 100} }
        self.mvp: dict[str, dict] = {
            "team_a": {"user": None, "coins": 0},
            "team_b": {"user": None, "coins": 0},
        }

    def is_fever_active(self) -> bool:
        if self.fever_active and time.time() > self.fever_ends_at:
            self.fever_active = False
        return self.fever_active

    def activate_fever(self):
        self.fever_active = True
        self.fever_ends_at = time.time() + FEVER_DURATION_SECONDS

    def reset_ball(self):
        self.ball_x = 50.0
        self.ball_y = 50.0

    def register_donation(self, username: str, coins: int, team_id: str):
        """Actualiza las monedas del usuario y el MVP del equipo."""
        current = self.donations.get(username, 0)
        self.donations[username] = current + coins

        mvp = self.mvp[team_id]
        if self.donations[username] > mvp["coins"]:
            previous_mvp = mvp["user"]
            mvp["user"] = username
            mvp["coins"] = self.donations[username]
            return previous_mvp  # Devuelve quién fue destronado (puede ser None)
        return None


# Instancia global del estado (como un Singleton)
game_state = GameState()


def _get_rule(coins: int) -> dict:
    """Busca la regla que aplica según la cantidad de monedas."""
    for rule in GIFT_RULES:
        if coins >= rule["coins"]:
            return rule
    return GIFT_RULES[-1]  # Regla mínima por defecto


def process_gift(username: str, gift_name: str, coins: int, team_id: str) -> dict:
    """
    Recibe un regalo y devuelve un dict con la acción a enviar al overlay.
    
    Retorna un dict con:
      - type: "goal" | "shot" | "push" | "fever"
      - team_id: "team_a" | "team_b"
      - username: quién donó
      - gift_name: nombre del regalo
      - coins: valor
      - ball_x, ball_y: nueva posición del balón
      - score_a, score_b: marcador actualizado
      - mvp_dethroned: nombre del MVP anterior si fue destronado (o null)
      - fever: true/false
    """
    multiplier = 2 if game_state.is_fever_active() else 1
    effective_coins = coins * multiplier

    rule = _get_rule(effective_coins)
    effect = rule["effect"]

    dethroned = game_state.register_donation(username, coins, team_id)

    is_team_a = team_id == "team_a"

    if effect == "goal":
        if is_team_a:
            game_state.score_a += 1
        else:
            game_state.score_b += 1
        game_state.reset_ball()

    elif effect == "shot":
        direction = 1 if is_team_a else -1
        game_state.ball_x += direction * rule["power"]
        game_state.ball_y += random.uniform(-8, 8)
        game_state.ball_x = max(5.0, min(90.0, game_state.ball_x))
        game_state.ball_y = max(10.0, min(90.0, game_state.ball_y))

        # Si el balón llega al borde, cuenta como gol automático
        if game_state.ball_x <= 5.0:
            game_state.score_b += 1
            game_state.reset_ball()
            effect = "goal"
        elif game_state.ball_x >= 90.0:
            game_state.score_a += 1
            game_state.reset_ball()
            effect = "goal"

    elif effect == "push":
        direction = 1 if is_team_a else -1
        game_state.ball_x += direction * rule["power"]
        game_state.ball_y += random.uniform(-4, 4)
        game_state.ball_x = max(5.0, min(90.0, game_state.ball_x))
        game_state.ball_y = max(10.0, min(90.0, game_state.ball_y))

    # Activación aleatoria del Modo Fiebre
    fever_triggered = False
    if not game_state.is_fever_active() and random.random() < FEVER_AUTO_CHANCE:
        game_state.activate_fever()
        fever_triggered = True

    return {
        "type": effect,
        "team_id": team_id,
        "username": username,
        "gift_name": gift_name,
        "coins": coins,
        "multiplier": multiplier,
        "ball_x": round(game_state.ball_x, 2),
        "ball_y": round(game_state.ball_y, 2),
        "score_a": game_state.score_a,
        "score_b": game_state.score_b,
        "mvp_a": game_state.mvp["team_a"],
        "mvp_b": game_state.mvp["team_b"],
        "mvp_dethroned": dethroned,
        "fever": game_state.is_fever_active(),
        "fever_triggered": fever_triggered,
    }
