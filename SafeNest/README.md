# SafeNest

A calm, family-focused cybersecurity companion for **macOS, iPhone, and iPad**. Plain language, large tap targets, Senior & Kid profiles — not an enterprise SOC console.

## Open & build (Mac + Xcode)

1. Install **Xcode 15+** from the Mac App Store.
2. Open the project:
   ```bash
   open SafeNest/SafeNest.xcodeproj
   ```
   Or double-click `SafeNest.xcodeproj` in Finder.
3. In the scheme menu, choose **SafeNest**.
4. Pick a destination: **My Mac**, an **iPhone** simulator, or an **iPad** simulator.
5. Press **Run** (⌘R).

First launch shows a three-step habit onboarding. Skip anytime; reopen from **Family → Show welcome tips again**.

### Tests

In Xcode: **Product → Test** (⌘U), or:

```bash
xcodebuild -scheme SafeNest -destination 'platform=macOS' test
```

## What’s implemented vs stubbed

| Feature | State |
|---------|--------|
| Onboarding (one habit at a time) | Implemented |
| Home hub + navigation (TabView / sidebar) | Implemented |
| Security checkup UI + plain-language copy | Implemented (statuses stubbed / demo) |
| Link & message helper | **Working** local heuristics |
| Family profiles (Standard / Senior / Kid) | Implemented (`AppStorage`) |
| Privacy glance | Implemented UI with **sample** rows |
| Real FileVault / TCC / update reads | Stubbed — see `docs/NEXT_STEPS.md` |

## Accessibility

Dynamic Type, VoiceOver labels/hints, high-contrast-friendly system colors, large controls (≥44pt).

## Project layout

```
SafeNest/
  SafeNest.xcodeproj
  SafeNest/                 # Multiplatform SwiftUI app sources
    Models/
    Services/
    Views/
    Resources/
  SafeNestTests/
  docs/NEXT_STEPS.md
```

## Safety

SafeNest does **not** include offensive security tooling, exploit code, or URL “detonation.” The link helper only analyzes text you paste, on-device.

## Cloud / Linux note

Apple SDKs are not available on Linux CI images. Compile and UI screenshots require a Mac with Xcode.
