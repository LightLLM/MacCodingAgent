import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var agent: AgentClient

    var body: some View {
        NavigationStack {
            Form {
                Section("Mac daemon") {
                    TextField("Agent base URL", text: $agent.baseURLString)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    Button("Save & reconnect") {
                        agent.saveBaseURL()
                        Task { await agent.refreshAll() }
                    }
                }

                Section("About") {
                    LabeledContent("App", value: "Mac Coding Agent")
                    LabeledContent("Platform", value: "iPhone companion")
                    Text("Point this phone at the agent running on your Mac (default port 8787). Use your Mac’s LAN IP when testing on a physical device.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
        }
    }
}
