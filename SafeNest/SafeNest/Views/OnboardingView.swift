import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var index: Int = 0
    @State private var iconSoft = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var steps: [OnboardingStep] { OnboardingContent.steps }
    private var step: OnboardingStep { steps[index] }
    private var isLast: Bool { index >= steps.count - 1 }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("SafeNest")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(SafeNestTheme.ink)
                Spacer()
                Button("Skip") {
                    appModel.completeOnboarding()
                }
                .font(.body.weight(.medium))
                .frame(minHeight: 44)
                .accessibilityLabel("Skip welcome tips")
            }
            .padding(.horizontal, 24)
            .padding(.top, 20)

            Spacer(minLength: 20)

            VStack(spacing: 24) {
                Image(systemName: step.systemImage)
                    .font(.system(size: 64))
                    .foregroundStyle(SafeNestTheme.accent)
                    .accessibilityHidden(true)
                    .scaleEffect(iconSoft ? 1.06 : 1.0)
                    .opacity(iconSoft ? 1.0 : 0.88)
                    .animation(reduceMotion ? nil : .easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: iconSoft)
                    .onAppear { iconSoft = !reduceMotion }

                Text(step.title)
                    .font(.largeTitle.weight(.bold))
                    .multilineTextAlignment(.center)

                Text(step.body)
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 8)

                Text(step.habitTip)
                    .font(.body.weight(.medium))
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(SafeNestTheme.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .accessibilityLabel("Practice tip. \(step.habitTip)")
            }
            .padding(.horizontal, 28)
            .accessibilityElement(children: .combine)

            Spacer(minLength: 20)

            progressDots
                .padding(.bottom, 16)

            LargePrimaryButton(
                title: isLast ? "Start using SafeNest" : "Next habit",
                systemImage: isLast ? "checkmark" : "arrow.right"
            ) {
                if isLast {
                    appModel.completeOnboarding()
                } else {
                    withAnimation(.easeInOut(duration: 0.25)) {
                        index += 1
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 28)
            .accessibilityHint(isLast ? "Finishes onboarding" : "Shows the next habit")
        }
        .background(SafeNestTheme.wash.ignoresSafeArea())
    }

    private var progressDots: some View {
        HStack(spacing: 10) {
            ForEach(steps.indices, id: \.self) { i in
                Capsule()
                    .fill(i == index ? SafeNestTheme.accent : Color.secondary.opacity(0.25))
                    .frame(width: i == index ? 28 : 10, height: 10)
                    .accessibilityHidden(true)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Tip \(index + 1) of \(steps.count)")
    }
}
