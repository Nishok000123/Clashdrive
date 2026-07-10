# Clash Drive (v1.0)

A serverless, client-side web application that transforms Telegram supergroup forum topics into a personal cloud storage workspace. Run entirely in your browser with direct Telegram Datacenter connection via MTProto.

---

## Features

- **Serverless SPA:** Runs fully in the browser with direct TCP/WebSocket handshakes to Telegram's production DCs. No server-side storage or API keys are proxied.
- **Folder-to-Topic Mapping:** Organizes your storage by mapping root folders directly to Telegram forum topic threads.
- **In-Browser Media Streaming:** Leverages a local Service Worker (sw.js) to intercept media range requests, fetch chunk segments from Telegram, and stream them progressively to in-browser video/audio players.
- **50MB Segmented Slicing:** Automatically splits files into 50MB chunks for reliable parallelized upload and download via MTProto pipeline concurrency.
- **Multi-Account Swapping:** Connect and seamlessly switch between up to 3 Telegram identities stored locally.
- **Quick Navigation:** Instantly search through folders and files using keyboard shortcuts (Ctrl + K or /).
- **Responsive Interface:** Dark-themed and light-themed UI featuring responsive card layouts, stats widgets, and custom theme switches.

---

## Local Development

Get a developer instance running locally in seconds:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local server:**
   ```bash
   npm run dev
   ```

3. **Build production bundle:**
   ```bash
   npm run build
   ```

---

## Metadata & Policies

- **[MIT License](./LICENSE)** — Terms of use and redistribution.
- **[Security Policy](./SECURITY.md)** — Vulnerability reporting guidelines.
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** — Standard community covenant.


