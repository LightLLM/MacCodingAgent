# Mac Coding Agent — macOS

## Install on Mac Mini / macOS

1. Download [`../web/public/downloads/MacCodingAgent-macOS-latest.zip`](../web/public/downloads/MacCodingAgent-macOS-latest.zip)
2. Unzip
3. Double-click **`Install Mac Coding Agent.command`**
4. If Gatekeeper warns: right-click → **Open** → **Open**
5. App installs to `/Applications` and launches  
   (first launch downloads Electron for your chip)

See the root [README](../README.md#install-on-macos-mac-mini) for full steps.

## Build the zip

```bash
npm run pack:macos
```

Creates `web/public/downloads/MacCodingAgent-macOS-latest.zip` with:

- `Mac Coding Agent.app`
- `Install Mac Coding Agent.command`
- `Open Without Installing.command`
- `README-INSTALL-MAC-MINI.txt`

## Tests / proof

```bash
npm run test:macos:unit
npm run test:macos:e2e
```

Real Darwin CI artifacts: [`../docs/proof/`](../docs/proof/)

## Native SwiftUI shell

Sources in `MacApp/MacCodingAgentMac/` for Xcode on macOS 13+.
