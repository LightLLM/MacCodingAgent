# Mac Coding Agent — macOS apps

## Download for Mac Mini (latest)

```bash
npm run pack:macos
```

Creates `web/public/downloads/MacCodingAgent-macOS-latest.zip` containing:

- `Mac Coding Agent.app` (Apple Silicon + Intel Electron runtimes)
- `Install Mac Coding Agent.command` (installs to `/Applications`)
- `README-INSTALL-MAC-MINI.txt`

### Install on Mac Mini

1. Download / unzip `MacCodingAgent-macOS-latest.zip`
2. Double-click **Install Mac Coding Agent.command**
3. If Gatekeeper warns: right-click → **Open** → **Open**
4. App opens from `/Applications` with a local embedded agent

## Native SwiftUI Mac app

Sources in `macos/MacApp/MacCodingAgentMac/` for Xcode on macOS 13+.

## Stripe + backend

Checkout: `/api/billing/checkout`. Webhooks: `POST /api/billing/webhook`.
