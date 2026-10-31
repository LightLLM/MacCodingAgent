# Mac Coding Agent — macOS apps

Two Mac clients ship with this repo:

## 1. Desktop shell (Electron) — downloadable zip

```bash
npm run pack:macos
```

Creates `web/public/downloads/MacCodingAgent-macOS.zip` with `Mac Coding Agent.app`.

Pro licenses from Stripe unlock the download page in the web app.

## 2. Native SwiftUI Mac app

Open `macos/MacApp/MacCodingAgentMac/` sources in Xcode (create an App target named **Mac Coding Agent**), then run on macOS 13+.

## Stripe + backend

Checkout hits `/api/billing/checkout` on the agent (or Vercel hosted `/api/billing/*`). Webhooks: `POST /api/billing/webhook`.
