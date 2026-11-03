import Foundation

/// Simulated privacy glance. Real TCC / permission APIs need entitlements.
struct PrivacyGlanceService {
    func loadItems(for profile: FamilyProfile) -> [PrivacyItem] {
        var items = sampleCatalog
        if profile.hidesAdvancedPrivacyDetail {
            items = items.filter { $0.category != "Developer tools" }
        }
        if profile.prefersSimplifiedCopy {
            items = items.map { item in
                var copy = item
                copy.detail = simplifiedDetail(for: item.id) ?? item.detail
                copy.suggestedAction = "Ask a helper to open Settings with you."
                return copy
            }
        }
        return items
    }

    private var sampleCatalog: [PrivacyItem] {
        [
            PrivacyItem(
                id: "camera",
                name: "Camera",
                category: "Sensors",
                detail: "A few apps can use the camera. Review any you do not recognize.",
                attention: .review,
                isStubbed: true,
                suggestedAction: "Settings → Privacy & Security → Camera"
            ),
            PrivacyItem(
                id: "microphone",
                name: "Microphone",
                category: "Sensors",
                detail: "Only keep mic access for apps you actively use.",
                attention: .ok,
                isStubbed: true,
                suggestedAction: "Settings → Privacy & Security → Microphone"
            ),
            PrivacyItem(
                id: "location",
                name: "Location",
                category: "Location",
                detail: "Prefer “While Using” over “Always” when you can.",
                attention: .review,
                isStubbed: true,
                suggestedAction: "Settings → Privacy & Security → Location Services"
            ),
            PrivacyItem(
                id: "photos",
                name: "Photos",
                category: "Files",
                detail: "Grant limited photo access when an app only needs a few pictures.",
                attention: .ok,
                isStubbed: true,
                suggestedAction: "Settings → Privacy & Security → Photos"
            ),
            PrivacyItem(
                id: "screen_recording",
                name: "Screen & System Audio",
                category: "Developer tools",
                detail: "Screen recording can see almost everything. Keep this list short.",
                attention: .review,
                isStubbed: true,
                suggestedAction: "System Settings → Privacy & Security → Screen & System Audio Recording"
            ),
            PrivacyItem(
                id: "full_disk",
                name: "Full Disk Access",
                category: "Developer tools",
                detail: "Full Disk Access is powerful. Only trusted helper tools should have it.",
                attention: .unknown,
                isStubbed: true,
                suggestedAction: "System Settings → Privacy & Security → Full Disk Access"
            )
        ]
    }

    private func simplifiedDetail(for id: String) -> String? {
        switch id {
        case "camera": return "Check which apps can use your camera."
        case "microphone": return "Check which apps can hear you."
        case "location": return "Check which apps know where you are."
        case "photos": return "Check which apps can see your pictures."
        case "screen_recording": return "Only special helper apps should see your screen."
        case "full_disk": return "Only trusted helper apps should see all your files."
        default: return nil
        }
    }
}
