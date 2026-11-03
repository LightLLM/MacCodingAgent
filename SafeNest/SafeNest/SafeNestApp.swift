import SwiftUI

@main
struct SafeNestApp: App {
    @StateObject private var appModel = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appModel)
                #if os(macOS)
                .frame(minWidth: 720, minHeight: 520)
                #endif
        }
        #if os(macOS)
        .defaultSize(width: 960, height: 640)
        #endif
    }
}
