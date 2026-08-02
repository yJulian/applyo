# Applyo CORS Proxy Server

Ein leichtgewichtiger, sicherer CORS-Proxy Server für Applyo. Er ermöglicht es dem Browser, KI-Endpunkte (z.B. Ollama, OpenRouter, LM Studio, KIT KI-Toolbox oder eigene OpenAI-kompatible Server) ohne CORS-Fehler aufzurufen.

---

## 🔒 Token-Authentifizierung (Sicherheit)

Um unbefugten Zugriff auf deinen Proxy zu verhindern, kannst du beim Starten ein Token per Umgebungsvariable `PROXY_TOKEN` (oder `PROXY_SECRET`) festlegen:

```bash
# Beispiel mit Podman / Docker:
podman run -d -p 8080:8080 -e PROXY_TOKEN="dein-geheimes-token-123" --name applyo-cors-proxy applyo-cors-proxy
```

Ist `PROXY_TOKEN` gesetzt, werden **alle Anfragen ohne gültiges Token** vom Proxy mit `401 Unauthorized` abgewiesen.

---

## 🚀 Schnellstart mit Podman / Docker

### Mit Podman / Docker CLI:
```bash
# Bild bauen & starten mit Docker
docker build -t applyo-cors-proxy ./cors-proxy
docker run -d -p 8080:8080 -e PROXY_TOKEN="dein-token" --name applyo-cors-proxy applyo-cors-proxy

# Oder mit Podman:
podman build -t applyo-cors-proxy ./cors-proxy
podman run -d -p 8080:8080 -e PROXY_TOKEN="dein-token" --name applyo-cors-proxy applyo-cors-proxy
```

### Mit Docker Compose / Podman Compose:
```bash
cd cors-proxy
docker compose up -d
# oder: podman-compose up -d
```

---

## ⚙️ Verwendung in Applyo

1. Starte den Proxy-Container mit deinem `PROXY_TOKEN`.
2. Öffne **Applyo** -> **Settings** -> **⚙️ KI Provider & Custom API**.
3. Trage unter **🌐 Optionaler CORS Proxy Server URL** folgendes ein:
   `https://applyo-cors-proxy.example.com`
4. Trage unter **🔑 CORS Proxy Token / Secret** dein gewähltes Token ein.
5. Speichern. Applyo sendet das Token nun bei jeder Anfrage im Header `x-proxy-token` mit!

---

## 📦 Container Registry (GHCR)

```bash
podman run -d -p 8080:8080 -e PROXY_TOKEN="dein-token" ghcr.io/<owner>/applyo-cors-proxy:latest
```
