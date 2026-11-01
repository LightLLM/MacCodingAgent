# Mac Coding Agent — iPhone app

SwiftUI companion for the 24/7 Mac daemon.

## Open in Xcode

```bash
open ios/MacCodingAgent/MacCodingAgent.xcodeproj
```

1. Select an iPhone simulator or device.
2. In **Settings**, set the agent base URL:
   - Simulator: `http://127.0.0.1:8787`
   - Device: `http://<your-mac-lan-ip>:8787`
3. Start the Mac daemon (`npm run dev` from the repo root).
4. Run the app.

## Tabs

- **Status** — uptime, model, task counts
- **Chat** — prompt the local coding agent
- **Models** — switch Ollama / stub / compatible models
- **Projects** — warm local workspaces
- **Settings** — daemon URL

## Tests

```bash
xcodebuild test \
  -project ios/MacCodingAgent/MacCodingAgent.xcodeproj \
  -scheme MacCodingAgent \
  -destination 'platform=iOS Simulator,name=iPhone 16'
```
