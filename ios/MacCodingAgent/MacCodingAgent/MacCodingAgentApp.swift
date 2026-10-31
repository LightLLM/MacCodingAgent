import SwiftUI

@main
struct MacCodingAgentApp: App {
    @StateObject private var agent = AgentClient()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(agent)
        }
    }
}
