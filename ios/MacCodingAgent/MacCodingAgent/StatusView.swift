import SwiftUI

struct StatusView: View {
    @EnvironmentObject private var agent: AgentClient

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Mac Coding Agent")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.06, green: 0.08, blue: 0.11))

                    Text("Your Mac daemon stays online so coding tasks can run overnight.")
                        .foregroundStyle(.secondary)

                    if let health = agent.health {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            MetricTile(title: "Status", value: health.status)
                            MetricTile(title: "Uptime", value: formatUptime(health.uptimeSeconds))
                            MetricTile(title: "Model", value: health.activeModel)
                            MetricTile(title: "Sessions", value: "\(health.sessions)")
                            MetricTile(title: "Running", value: "\(health.tasksRunning)")
                            MetricTile(
                                title: "Local models",
                                value: health.localModelsReachable ? "Reachable" : "Stub"
                            )
                        }
                    } else {
                        ProgressView("Connecting to Mac…")
                    }

                    if let error = agent.errorMessage {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }
                .padding()
            }
            .background(Color(red: 0.93, green: 0.95, blue: 0.96))
            .navigationTitle("Status")
            .refreshable { await agent.refreshAll() }
        }
    }

    private func formatUptime(_ seconds: Int) -> String {
        let h = seconds / 3600
        let m = (seconds % 3600) / 60
        let s = seconds % 60
        if h > 0 { return "\(h)h \(m)m" }
        if m > 0 { return "\(m)m \(s)s" }
        return "\(s)s"
    }
}

struct MetricTile: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.white.opacity(0.85))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
