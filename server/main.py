# main.py
# Punto de entrada. Arranca 3 servicios en paralelo:
#   1. Servidor WebSocket  → para el overlay
#   2. Listener/Simulador  → regalos automáticos (reemplazar por TikTok real después)
#   3. Panel de control    → http://localhost:8766

import asyncio
import threading
from websocket_server import start_server, broadcast
from tiktok_listener import start_listener
from control_panel import start_panel, set_loop_and_broadcast


async def main():
    print("=" * 50)
    print("  TikTok Football — Servidor iniciando")
    print("=" * 50)

    # Obtiene el event loop actual y lo comparte con el panel HTTP
    loop = asyncio.get_event_loop()
    set_loop_and_broadcast(loop, broadcast)

    # El panel HTTP corre en un hilo separado porque es síncrono
    panel_thread = threading.Thread(target=start_panel, daemon=True)
    panel_thread.start()

    # WebSocket + Simulador corren juntos en el event loop asíncrono
    await asyncio.gather(
        start_server(),
        start_listener(),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Sistema] Servidor detenido.")
