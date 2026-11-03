import Foundation

/// Stubbed security checkup. Real FileVault / update / Find My APIs need
/// entitlements and a signed Mac build — see SafeNest/docs/NEXT_STEPS.md.
struct SecurityCheckService {
    func loadChecks(for profile: FamilyProfile) -> [SecurityCheckItem] {
        var items = baseChecks

        if profile == .kid {
            // Kids see fewer, clearer rows.
            items = items.filter { ["screen_lock", "updates", "phishing"].contains($0.id) }
        }

        if profile.prefersSimplifiedCopy {
            items = items.map { item in
                var copy = item
                copy.whyItMatters = simplifiedWhy(for: item.id) ?? item.whyItMatters
                copy.howToFix = simplifiedHow(for: item.id) ?? item.howToFix
                return copy
            }
        }

        return items
    }

    private var baseChecks: [SecurityCheckItem] {
        [
            SecurityCheckItem(
                id: "screen_lock",
                title: "Screen lock is on",
                whyItMatters: "A passcode or password keeps strangers out if the device is left alone.",
                howToFix: "On iPhone/iPad: Settings → Face ID & Passcode. On Mac: System Settings → Lock Screen.",
                status: .pass,
                isStubbed: true,
                platforms: ["iOS", "iPadOS", "macOS"]
            ),
            SecurityCheckItem(
                id: "updates",
                title: "Automatic updates",
                whyItMatters: "Updates quietly fix security problems without extra work from you.",
                howToFix: "Turn on Automatic Updates in Settings → General → Software Update (or System Settings on Mac).",
                status: .attention,
                isStubbed: true,
                platforms: ["iOS", "iPadOS", "macOS"]
            ),
            SecurityCheckItem(
                id: "find_my",
                title: "Find My is ready",
                whyItMatters: "If a device is lost, Find My helps locate it or erase it remotely.",
                howToFix: "Sign in with your Apple Account and enable Find My in Settings.",
                status: .pass,
                isStubbed: true,
                platforms: ["iOS", "iPadOS", "macOS"]
            ),
            SecurityCheckItem(
                id: "encryption",
                title: encryptionTitle,
                whyItMatters: "Encryption protects files if someone steals the device.",
                howToFix: encryptionHowTo,
                status: .unknown,
                isStubbed: true,
                platforms: ["macOS", "iOS", "iPadOS"]
            ),
            SecurityCheckItem(
                id: "phishing",
                title: "Spot a phishing message",
                whyItMatters: "Scams often rush you with fear. Pausing is a powerful habit.",
                howToFix: "Use Link Helper before you tap. Never share passwords or gift cards from a surprise message.",
                status: .learn,
                isStubbed: false,
                platforms: ["iOS", "iPadOS", "macOS"]
            )
        ]
    }

    private var encryptionTitle: String {
        #if os(macOS)
        return "FileVault disk encryption"
        #else
        return "Device encryption"
        #endif
    }

    private var encryptionHowTo: String {
        #if os(macOS)
        return "System Settings → Privacy & Security → FileVault. (Real status needs a signed Mac build.)"
        #else
        return "Modern iPhone and iPad encrypt data when a passcode is set."
        #endif
    }

    private func simplifiedWhy(for id: String) -> String? {
        switch id {
        case "screen_lock": return "This stops other people from opening your apps if they pick up your device."
        case "updates": return "Your Apple device can fix itself quietly when updates are automatic."
        case "find_my": return "If you lose your device, Apple can help you find it."
        case "encryption": return "Your photos and files stay private even if the device is stolen."
        case "phishing": return "Bad messages try to scare you. You can always pause and ask for help."
        default: return nil
        }
    }

    private func simplifiedHow(for id: String) -> String? {
        switch id {
        case "screen_lock": return "Ask a helper to open Settings and confirm a passcode is on."
        case "updates": return "Ask a helper to turn on Automatic Updates in Settings."
        case "find_my": return "Stay signed in to your Apple Account."
        case "encryption": return "On Mac, ask a helper about FileVault. On iPhone, a passcode is enough."
        case "phishing": return "Paste the message into SafeNest’s Link Helper before you tap."
        default: return nil
        }
    }
}
