import Foundation

enum RiskLevel: String, Codable {
    case low
    case caution
    case high

    var title: String {
        switch self {
        case .low: return "Looks okay"
        case .caution: return "Be careful"
        case .high: return "High risk"
        }
    }

    var plainSummary: String {
        switch self {
        case .low:
            return "Nothing strongly suspicious stood out. Still, only open links you trust."
        case .caution:
            return "A few warning signs showed up. Pause and check with someone you trust before tapping."
        case .high:
            return "This looks risky. Do not tap the link or share passwords, money, or codes."
        }
    }

    var systemImage: String {
        switch self {
        case .low: return "shield.checkered"
        case .caution: return "exclamationmark.shield.fill"
        case .high: return "xmark.shield.fill"
        }
    }
}

struct RiskSignal: Identifiable, Codable, Equatable {
    let id: String
    var label: String
    var detail: String
}

struct LinkRiskResult: Identifiable, Codable, Equatable {
    let id: UUID
    var level: RiskLevel
    var headline: String
    var explanation: String
    var signals: [RiskSignal]
    var advice: [String]
    var analyzedAt: Date

    static let empty = LinkRiskResult(
        id: UUID(),
        level: .low,
        headline: "Paste a link or message",
        explanation: "SafeNest checks text on this device only. Nothing is sent to a server.",
        signals: [],
        advice: ["Only open links from people you know."],
        analyzedAt: .distantPast
    )
}
