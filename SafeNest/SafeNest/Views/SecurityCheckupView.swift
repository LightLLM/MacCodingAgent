import SwiftUI

struct SecurityCheckupView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    SectionIntro(
                        title: appModel.profile.prefersSimplifiedCopy ? "Your safety checklist" : "Security checkup",
                        subtitle: appModel.profile.prefersSimplifiedCopy
                            ? "Green means good. Orange means take a look with a helper."
                            : "Plain-language checks for lock screen, updates, Find My, encryption, and phishing basics."
                    )
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 12, leading: 4, bottom: 8, trailing: 4))
                }

                Section {
                    ForEach(appModel.securityChecks) { item in
                        CheckRow(item: item)
                    }
                } footer: {
                    Text("Rows marked “Demo status” are simulated until SafeNest can read real device settings with the right Apple entitlements.")
                        .font(.footnote)
                }
            }
            .navigationTitle("Checkup")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        appModel.refreshAll()
                    } label: {
                        if appModel.isRefreshingChecks {
                            ProgressView()
                        } else {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    }
                    .accessibilityLabel("Refresh checkup")
                    .disabled(appModel.isRefreshingChecks)
                }
            }
        }
    }
}
