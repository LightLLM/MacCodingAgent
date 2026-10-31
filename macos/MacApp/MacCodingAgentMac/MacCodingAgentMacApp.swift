import SwiftUI

@main
struct MacCodingAgentMacApp: App {
    var body: some Scene {
        WindowGroup("Mac Coding Agent") {
            MacRootView()
        }
        .defaultSize(width: 1100, height: 760)
    }
}
