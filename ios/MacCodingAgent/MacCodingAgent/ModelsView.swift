import SwiftUI

struct ModelsView: View {
    @EnvironmentObject private var agent: AgentClient

    var body: some View {
        NavigationStack {
            List(agent.models) { model in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(model.name).font(.headline)
                        Spacer()
                        if agent.health?.activeModel == model.id {
                            Text("Active")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(Color(red: 0.04, green: 0.48, blue: 0.43))
                        }
                    }
                    Text("\(model.provider) · \(model.description)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Button("Use on Mac") {
                        Task { await agent.setActiveModel(model.id) }
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Models")
            .refreshable { await agent.refreshModels() }
        }
    }
}
