import Foundation

enum PrivacyAttention: String, Codable {
    case ok
    case review
    case unknown

    var title: String {
        switch self {
        case .ok: return "Looks fine"
        case .review: return "Worth a review"
        case .unknown: return "Demo data"
        }
    }
}

struct PrivacyItem: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var category: String
    var detail: String
    var attention: PrivacyAttention
    var isStubbed: Bool
    var suggestedAction: String

    var accessibilitySummary: String {
        let stub = isStubbed ? " Sample data." : ""
        return "\(name), \(category). \(attention.title). \(detail)\(stub)"
    }
}
