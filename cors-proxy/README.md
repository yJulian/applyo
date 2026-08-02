# Applyo CORS Proxy Server

Ein leichtgewichtiger, nutzungsfreundlicher CORS-Proxy Server für Applyo. Er ermöglicht es dem Browser, KI-Endpunkte (z.B. Ollama, OpenRouter, LM Studio, KIT KI-Toolbox oder eigene OpenAI-kompatible Server) ohne CORS-Fehler aufzurufen.

---

## 🚀 Schnellstart mit Podman / Docker

### Mit Podman / Docker CLI:
```bash
# Bild bauen & starten mit Docker
docker build -t applyo-cors-proxy ./cors-proxy
docker run -d -p 8080:8080 --name applyo-cors-proxy applyo-cors-proxy

# Oder mit Podman:
podman build -t applyo-cors-proxy ./cors-proxy
podman run -d -p 8080:8080 --name applyo-cors-proxy applyo-cors-proxy
```

### Mit Docker Compose / Podman Compose:
```bash
cd cors-proxy
docker compose up -d
# oder: podman-compose up -d
```

---

## ⚙️ Verwendung in Applyo

1. Starte den Proxy-Container auf Port `8080`.
2. Öffne **Applyo** -> **Settings** -> **⚙️ KI Provider & Custom API**.
3. Trage unter **🌐 Optionaler CORS Proxy Server URL** folgendes ein:
   `http://localhost:8080`
4. Speichern. Alle KI-Anfragen für Custom Endpunkte werden nun automatisch und ohne CORS-Sperren vom Proxy weitergeleitet!

---

## 📦 Container Registry (GHCR)

Der Proxy wird automatisch über GitHub Actions gebaut und im GitHub Container Registry bereitgestellt:
```bash
podman run -d -p 8080:8080 ghcr.io/<owner>/applyo-cors-proxy:latest
```
