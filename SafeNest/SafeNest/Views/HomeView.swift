import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appModel: AppModel
    @Binding var selectedTab: AppTab
    @State private var appeared = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var attentionCount: Int {
        appModel.securityChecks.filter { $0.status == .attention }.count
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    hero
                    quickActions
                    habitCard
                }
                .padding(24)
                .opacity(appeared || reduceMotion ? 1 : 0)
                .offset(y: appeared || reduceMotion ? 0 : 12)
            }
            .background(SafeNestTheme.wash.ignoresSafeArea())
            .navigationTitle("SafeNest")
            .onAppear {
                guard !reduceMotion else {
                    appeared = true
                    return
                }
                withAnimation(.easeOut(duration: 0.45)) {
                    appeared = true
                }
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("SafeNest")
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundStyle(SafeNestTheme.ink)
                .accessibilityAddTraits(.isHeader)

            Text(appModel.homeGreeting)
                .font(.title2)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 12) {
                StatusBadge(
                    title: appModel.profile.title + " mode",
                    systemImage: appModel.profile.symbolName,
                    tint: SafeNestTheme.accent
                )
                if attentionCount > 0 {
                    StatusBadge(
                        title: "\(attentionCount) to review",
                        systemImage: "exclamationmark.circle.fill",
                        tint: .orange
                    )
                }
            }
            .accessibilityElement(children: .combine)
        }
    }

    private var quickActions: some View {
        VStack(spacing: 14) {
            LargePrimaryButton(title: "Run security checkup", systemImage: "checklist") {
                selectedTab = .checkup
            }
            .accessibilityHint("Opens the security checklist")

            Button {
                selectedTab = .links
            } label: {
                Label("Check a suspicious link", systemImage: "link")
                    .font(.title3.weight(.medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)
            .accessibilityHint("Opens the link and message helper")

            Button {
                selectedTab = .privacy
            } label: {
                Label("Privacy glance", systemImage: "eye.slash")
                    .font(.title3.weight(.medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)
        }
    }

    private var habitCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Today’s gentle reminder", systemImage: "heart.fill")
                .font(.headline)
                .foregroundStyle(SafeNestTheme.accent)
            Text(habitCopy)
                .font(.body)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    private var habitCopy: String {
        switch appModel.profile {
        case .kid:
            return "If a message feels weird or scary, stop and ask a grown-up before you tap."
        case .senior:
            return "You never have to rush. Real companies will wait while you check with family."
        case .standard:
            return "One lock, one pause before links, one update setting — small habits, big calm."
        }
    }
}
