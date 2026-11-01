import SwiftUI

struct ProjectsView: View {
    @EnvironmentObject private var agent: AgentClient

    var body: some View {
        NavigationStack {
            List(agent.projects) { project in
                VStack(alignment: .leading, spacing: 4) {
                    Text(project.name).font(.headline)
                    Text("\(project.language) · \(project.path)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Projects")
            .refreshable { await agent.refreshProjects() }
        }
    }
}
