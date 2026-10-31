import SwiftUI

struct ChatView: View {
    @EnvironmentObject private var agent: AgentClient
    @State private var draft = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let session = agent.activeSession {
                    ScrollViewReader { proxy in
                        ScrollView {
                            LazyVStack(alignment: .leading, spacing: 12) {
                                ForEach(session.messages.filter { $0.role != "system" }) { message in
                                    MessageBubble(message: message)
                                        .id(message.id)
                                }
                            }
                            .padding()
                        }
                        .onChange(of: session.messages.count) { _, _ in
                            if let last = session.messages.last {
                                withAnimation {
                                    proxy.scrollTo(last.id, anchor: .bottom)
                                }
                            }
                        }
                    }
                } else {
                    ContentUnavailableView(
                        "No session",
                        systemImage: "laptopcomputer",
                        description: Text("Create a session to prompt Mac Coding Agent from your iPhone.")
                    )
                }

                HStack(alignment: .bottom, spacing: 10) {
                    TextField("Describe a coding task…", text: $draft, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...5)
                    Button("Send") {
                        let content = draft
                        draft = ""
                        Task { await agent.sendPrompt(content) }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(agent.isBusy || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
            .navigationTitle("Chat")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("New") {
                        Task { await agent.createSession() }
                    }
                }
            }
        }
    }
}

struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.role == "user" { Spacer(minLength: 40) }
            Text(message.content)
                .padding(12)
                .background(message.role == "user" ? Color(red: 0.06, green: 0.08, blue: 0.11) : Color.white)
                .foregroundStyle(message.role == "user" ? Color.white : Color.primary)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            if message.role != "user" { Spacer(minLength: 40) }
        }
    }
}
