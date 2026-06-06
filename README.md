# TikTok Football — Guía de instalación

## Estructura de archivos

```
tiktok-football/
├── server/
│   ├── main.py               ← Punto de entrada. Ejecuta este archivo.
│   ├── config.py             ← Tu configuración (usuario TikTok, equipos, etc.)
│   ├── websocket_server.py   ← Servidor WebSocket (no tocar)
│   ├── tiktok_listener.py    ← Conexión con TikTok Live
│   └── gift_processor.py    ← Lógica de negocio del juego
├── overlay/
│   └── index.html            ← Agregar en OBS como fuente de navegador
└── requirements.txt
```

---

## Paso 1 — Instalar Python

Ve a https://python.org/downloads y descarga Python 3.11 o superior.
Durante la instalación, marca la opción **"Add Python to PATH"**.

---

## Paso 2 — Instalar dependencias

Abre una terminal (PowerShell o CMD) dentro de la carpeta `tiktok-football/` y ejecuta:

```bash
pip install -r requirements.txt
```

---

## Paso 3 — Configurar el servidor

Abre `server/config.py` y edita:

```python
TIKTOK_USERNAME = "@tu_usuario_aqui"   # Tu usuario de TikTok (con @)

TEAM_A = { "name": "Argentina", "flag": "🇦🇷", ... }
TEAM_B = { "name": "Brasil",    "flag": "🇧🇷", ... }
```

---

## Paso 4 — Correr el servidor

Desde la carpeta `server/`, ejecuta:

```bash
cd server
python main.py
```

Deberías ver en la consola:
```
==================================================
  TikTok Football — Servidor iniciando
==================================================
[WS] Servidor WebSocket en ws://localhost:8765
[TikTok] Conectando a @tu_usuario...
[TikTok] Conectado al Live de @tu_usuario
```

---

## Paso 5 — Configurar OBS

1. En OBS, agrega una nueva fuente: **Fuente de Navegador** (Browser Source)
2. URL: la ruta completa a `overlay/index.html`  
   Ejemplo: `file:///C:/Users/TuNombre/tiktok-football/overlay/index.html`
3. Ancho: 1920 | Alto: 1080
4. Marca **"Actualizar cuando la escena se vuelva activa"**

---

## Flujo completo

```
TikTok Live → tiktok_listener.py → gift_processor.py → websocket_server.py → overlay/index.html → OBS
```

---

## Solución de problemas

| Problema | Solución |
|---|---|
| "ModuleNotFoundError" | Ejecuta `pip install -r requirements.txt` de nuevo |
| "Could not connect to TikTok" | Asegúrate de que el Live esté activo |
| El overlay no conecta | Verifica que `main.py` esté corriendo y el puerto 8765 libre |
| Regalos no detectados | TikTokLive requiere que el Live tenga al menos 1000 seguidores |
