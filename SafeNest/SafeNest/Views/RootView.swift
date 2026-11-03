import SwiftUI

enum AppTab: String, Hashable, CaseIterable {
    case home
    case checkup
    case links
    case privacy
    case family

    var title: String {
        switch self {
        case .home: return "Home"
        case .checkup: return "Checkup"
        case .links: return "Links"
        case .privacy: return "Privacy"
        case .family: return "Family"
        }
    }

    var systemImage: String {
        switch self {
        case .home: return "house.fill"
        case .checkup: return "checklist"
        case .links: return "link"
        case .privacy: return "eye.slash.fill"
        case .family: return "person.2.fill"
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedTab: AppTab = .home

    var body: some View {
        Group {
            if appModel.onboardingCompleted {
                mainChrome
            } else {
                OnboardingView()
            }
        }
        .tint(SafeNestTheme.accent)
    }

    @ViewBuilder
    private var mainChrome: some View {
        #if os(macOS)
        NavigationSplitView {
            List(AppTab.allCases, selection: $selectedTab) { tab in
                Label(tab.title, systemImage: tab.systemImage)
                    .tag(tab)
                    .accessibilityLabel(tab.title)
            }
            .navigationSplitViewColumnWidth(min: 180, ideal: 200)
            .listStyle(.sidebar)
        } detail: {
            detail(for: selectedTab)
        }
        #else
        TabView(selection: $selectedTab) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                detail(for: tab)
                    .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                    .tag(tab)
            }
        }
        #endif
    }

    @ViewBuilder
    private func detail(for tab: AppTab) -> some View {
        switch tab {
        case .home: HomeView(selectedTab: $selectedTab)
        case .checkup: SecurityCheckupView()
        case .links: LinkHelperView()
        case .privacy: PrivacyGlanceView()
        case .family: FamilyProfilesView()
        }
    }
}

enum SafeNestTheme {
    /// Soft teal — calm and distinct from generic purple/AI defaults.
    static let accent = Color(red: 0.12, green: 0.48, blue: 0.48)
    static let wash = Color(red: 0.93, green: 0.96, blue: 0.95)
    static let ink = Color(red: 0.12, green: 0.18, blue: 0.20)
}
