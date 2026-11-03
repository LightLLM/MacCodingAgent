import Foundation

enum FamilyProfile: String, CaseIterable, Identifiable, Codable {
    case standard
    case senior
    case kid

    var id: String { rawValue }

    var title: String {
        switch self {
        case .standard: return "Standard"
        case .senior: return "Senior"
        case .kid: return "Kid"
        }
    }

    var shortDescription: String {
        switch self {
        case .standard:
            return "Clear guidance with every SafeNest tool available."
        case .senior:
            return "Larger type feel, fewer choices, extra plain-language tips."
        case .kid:
            return "Simple words and only the most important safety tools."
        }
    }

    var symbolName: String {
        switch self {
        case .standard: return "person.fill"
        case .senior: return "figure.walk"
        case .kid: return "figure.and.child.holdinghands"
        }
    }

    /// Softer, shorter copy for Senior / Kid where helpful.
    var prefersSimplifiedCopy: Bool {
        self == .senior || self == .kid
    }

    var hidesAdvancedPrivacyDetail: Bool {
        self == .kid
    }
}
