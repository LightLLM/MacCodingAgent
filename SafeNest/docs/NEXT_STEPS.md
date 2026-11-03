# SafeNest — next steps (real APIs & entitlements)

This scaffold uses honest **demo / sample** statuses for device checks. Wire the following on a Mac with a developer-signed build.

## macOS

| Check | Approach | Entitlement / note |
|-------|----------|--------------------|
| FileVault | `fdesetup status` via privileged helper **or** documented MDM/security APIs | Not available from a sandboxed App Store app without a helper; consider open-source “open in System Settings” deep link first |
| Automatic updates | Read software update preferences; or deep-link to System Settings | Preference keys vary by OS version — prefer Settings link in v1.1 |
| Find My | Cannot reliably query for another user’s devices; prompt user to confirm in Settings | Use `x-apple.systempreferences:` / Settings URLs |
| Full Disk / Screen Recording | List via Privacy Preferences only with FDA; otherwise deep-link | TCC is private — do not scrape TCC.db |

## iOS / iPadOS

| Check | Approach |
|-------|----------|
| Passcode | No public API for “is passcode set” on modern iOS — educate + Settings link |
| Updates | Deep-link / instruct General → Software Update |
| Permissions | `UIApplication.openSettingsURLString`; optional ATT / photo limited-library prompts only for SafeNest’s own access |

## Link helper

Keep heuristics local. Optional later: Apple’s on-device models, or a privacy-preserving URL reputation API with clear consent — never silent network “detonation.”

## Shipping

1. Create Apple Developer App ID `com.safenest.app`
2. Add icons (1024×1024 + Mac sizes)
3. TestFlight internal → external
4. Privacy nutrition labels: SafeNest collects nothing in the scaffold
5. Accessibility audit with VoiceOver + Dynamic Type XXXL
