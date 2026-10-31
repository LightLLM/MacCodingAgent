import SwiftUI

struct RootView: View {
    @EnvironmentObject private var agent: AgentClient

    var body: some View {
        TabView {
            StatusView()
                .tabItem { Label("Status", systemImage: "bolt.horizontal.circle.fill") }
            ChatView()
                .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right.fill") }
            ModelsView()
                .tabItem { Label("Models", systemImage: "cpu") }
            ProjectsView()
                .tabItem { Label("Projects", systemImage: "folder") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
        .tint(Color(red: 0.04, green: 0.48, blue: 0.43))
        .task {
            await agent.bootstrap()
        }
    }
}
