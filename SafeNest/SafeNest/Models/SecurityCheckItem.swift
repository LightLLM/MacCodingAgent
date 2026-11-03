import Foundation

enum CheckStatus: String, Codable {
    case pass
    case attention
    case learn
    case unknown

    var title: String {
        switch self {
        case .pass: return "Looking good"
        case .attention: return "Needs a look"
        case .learn: return "Learn this"
        case .unknown: return "Not checked yet"
        }
    }

    var systemImage: String {
        switch self {
        case .pass: return "checkmark.circle.fill"
        case .attention: return "exclamationmark.circle.fill"
        case .learn: return "lightbulb.fill"
        case .unknown: return "questionmark.circle"
        }
    }
}

struct SecurityCheckItem: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var whyItMatters: String
    var howToFix: String
    var status: CheckStatus
    var isStubbed: Bool
    var platforms: [String]

    var accessibilitySummary: String {
        let stubNote = isStubbed ? " Demo status only." : ""
        return "\(title). \(status.title). \(whyItMatters)\(stubNote)"
    }
}
