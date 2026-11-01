# macOS proof artifacts

## Real macOS CI (GitHub Actions `macos-latest`)

Job: **macOS desktop e2e (real macOS)**  
Example successful run: https://github.com/LightLLM/MacCodingAgent/actions/runs/41271026912

| File | Meaning |
|------|---------|
| `macos-e2e-report.json` | Summary — `platform: darwin`, `electronLaunch: true` |
| `macos-e2e-health.json` | Embedded agent `/api/health` on Darwin |
| `macos-e2e-chat.json` | Chat e2e reply from desktop server |
| `macos-electron-health.json` | Health from Electron-launched process |
| `macos-desktop-screenshot.png` | Screenshot captured on the macOS runner |
| `macos-package-validation.json` | `.app` zip structure checks |

## Reproduce locally

```bash
npm run test:macos:unit
npm run test:macos:e2e    # on a Mac, also launches Electron
```
