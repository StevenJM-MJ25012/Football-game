# websocket_server.py
# Servidor WebSocket — mantiene conexiones abiertas con el overlay y hace broadcast.
# Equivalente a un SignalR Hub en .NET.

import asyncio
import json
import websockets
from websockets.server import WebSocketServerProtocol
from config import WEBSOCKET_HOST, WEBSOCKET_PORT


# Set de clientes conectados. Equivalente a los grupos en SignalR.
_connected_clients: set[WebSocketServerProtocol] = set()


async def _handle_connection(websocket: WebSocketServerProtocol):
    """Se llama automáticamente cada vez que un cliente se conecta."""
    _connected_clients.add(websocket)
    client_ip = websocket.remote_address[0]
    print(f"[WS] Cliente conectado: {client_ip} — Total: {len(_connected_clients)}")

    try:
        # Mantiene la conexión viva esperando mensajes del cliente
        await websocket.wait_closed()
    finally:
        _connected_clients.discard(websocket)
        print(f"[WS] Cliente desconectado. Total: {len(_connected_clients)}")


async def broadcast(message: dict):
    """
    Envía un mensaje a todos los clientes conectados.
    Equivalente a Clients.All.SendAsync() en SignalR.
    """
    if not _connected_clients:
        return

    payload = json.dumps(message)
    # Envía a todos en paralelo e ignora los que fallaron
    results = await asyncio.gather(
        *[client.send(payload) for client in _connected_clients],
        return_exceptions=True,
    )
    for result in results:
        if isinstance(result, Exception):
            print(f"[WS] Error enviando a un cliente: {result}")


async def start_server():
    """Inicia el servidor WebSocket y lo deja corriendo."""
    print(f"[WS] Servidor WebSocket en ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}")
    async with websockets.serve(_handle_connection, WEBSOCKET_HOST, WEBSOCKET_PORT):
        await asyncio.Future()  # Corre para siempre (equivalente a app.Run() en .NET)
