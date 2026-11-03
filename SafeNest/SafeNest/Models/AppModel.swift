import Foundation
import SwiftUI

@MainActor
final class AppModel: ObservableObject {
    @AppStorage("safenest.profile") private var profileRaw: String = FamilyProfile.standard.rawValue
    @AppStorage("safenest.onboardingCompleted") var onboardingCompleted: Bool = false

    @Published var securityChecks: [SecurityCheckItem] = []
    @Published var privacyItems: [PrivacyItem] = []
    @Published var lastLinkResult: LinkRiskResult = .empty
    @Published var isRefreshingChecks: Bool = false

    private let securityService = SecurityCheckService()
    private let privacyService = PrivacyGlanceService()
    let linkAnalyzer = LinkRiskAnalyzer()

    var profile: FamilyProfile {
        get { FamilyProfile(rawValue: profileRaw) ?? .standard }
        set {
            profileRaw = newValue.rawValue
            objectWillChange.send()
        }
    }

    var homeGreeting: String {
        switch profile {
        case .senior:
            return "Welcome. We’ll take this one step at a time."
        case .kid:
            return "Hi! Let’s stay safe online together."
        case .standard:
            return "A calm place to check your family’s Apple devices."
        }
    }

    init() {
        refreshAll(animated: false)
    }

    func refreshAll(animated: Bool = true) {
        if animated { isRefreshingChecks = true }
        securityChecks = securityService.loadChecks(for: profile)
        privacyItems = privacyService.loadItems(for: profile)
        if animated {
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 350_000_000)
                isRefreshingChecks = false
            }
        }
    }

    func analyzeLinkOrMessage(_ text: String) {
        lastLinkResult = linkAnalyzer.analyze(text)
    }

    func completeOnboarding() {
        onboardingCompleted = true
    }

    func resetOnboarding() {
        onboardingCompleted = false
    }
}
