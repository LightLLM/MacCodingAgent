import Foundation

struct OnboardingStep: Identifiable, Equatable {
    let id: String
    var title: String
    var body: String
    var habitTip: String
    var systemImage: String
}

enum OnboardingContent {
    static let steps: [OnboardingStep] = [
        OnboardingStep(
            id: "lock",
            title: "Lock your screen",
            body: "When you step away — even for a minute — lock the Mac, iPhone, or iPad. It is the simplest habit that protects everything else.",
            habitTip: "Practice: lock once today before you leave the room.",
            systemImage: "lock.fill"
        ),
        OnboardingStep(
            id: "links",
            title: "Pause before you tap",
            body: "Unexpected links and urgent messages are how scams often start. Paste them into SafeNest’s helper first.",
            habitTip: "Practice: paste one message you are unsure about into Link Helper.",
            systemImage: "link.badge.plus"
        ),
        OnboardingStep(
            id: "updates",
            title: "Keep updates automatic",
            body: "Software updates quietly fix security holes. Turning them on once saves worry later.",
            habitTip: "Practice: open System Settings or Settings and confirm Automatic Updates is on.",
            systemImage: "arrow.triangle.2.circlepath"
        )
    ]
}
