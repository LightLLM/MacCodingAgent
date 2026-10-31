import Foundation
import Combine

@MainActor
final class AgentClient: ObservableObject {
    @Published var baseURLString: String = UserDefaults.standard.string(forKey: "mca.baseURL") ?? "http://127.0.0.1:8787"
    @Published var health: AgentHealth?
    @Published var sessions: [Session] = []
    @Published var models: [ModelInfo] = []
    @Published var projects: [ProjectInfo] = []
    @Published var activeSessionId: String?
    @Published var errorMessage: String?
    @Published var isBusy = false

    private var pollTask: Task<Void, Never>?

    var activeSession: Session? {
        sessions.first { $0.id == activeSessionId }
    }

    func saveBaseURL() {
        UserDefaults.standard.set(baseURLString, forKey: "mca.baseURL")
    }

    func startPolling() {
        pollTask?.cancel()
        pollTask = Task {
            while !Task.isCancelled {
                await refreshHealth()
                try? await Task.sleep(nanoseconds: 3_000_000_000)
            }
        }
    }

    func stopPolling() {
        pollTask?.cancel()
        pollTask = nil
    }

    func bootstrap() async {
        await refreshAll()
        startPolling()
    }

    func refreshAll() async {
        await refreshHealth()
        await refreshSessions()
        await refreshModels()
        await refreshProjects()
    }

    func refreshHealth() async {
        do {
            health = try await get("/api/health")
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func refreshSessions() async {
        do {
            let response: SessionsResponse = try await get("/api/sessions")
            sessions = response.sessions
            if activeSessionId == nil {
                activeSessionId = sessions.first?.id
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func refreshModels() async {
        do {
            let response: ModelsResponse = try await get("/api/models")
            models = response.models
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func refreshProjects() async {
        do {
            let response: ProjectsResponse = try await get("/api/projects")
            projects = response.projects
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createSession(title: String = "New coding session") async {
        isBusy = true
        defer { isBusy = false }
        do {
            let response: SessionResponse = try await post("/api/sessions", body: ["title": title])
            sessions.insert(response.session, at: 0)
            activeSessionId = response.session.id
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func sendPrompt(_ content: String) async {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        isBusy = true
        defer { isBusy = false }

        do {
            if activeSessionId == nil {
                await createSession(title: String(trimmed.prefix(48)))
            }
            guard let sessionId = activeSessionId else { return }
            let response: ChatResponse = try await post(
                "/api/sessions/\(sessionId)/chat",
                body: ["content": trimmed]
            )
            if let index = sessions.firstIndex(where: { $0.id == response.session.id }) {
                sessions[index] = response.session
            } else {
                sessions.insert(response.session, at: 0)
            }
            await refreshHealth()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func setActiveModel(_ modelId: String) async {
        do {
            let _: [String: String] = try await post("/api/models/active", body: ["modelId": modelId])
            await refreshHealth()
            await refreshModels()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func get<T: Decodable>(_ path: String) async throws -> T {
        let url = try url(for: path)
        let (data, response) = try await URLSession.shared.data(from: url)
        try validate(response)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func post<T: Decodable>(_ path: String, body: [String: String]) async throws -> T {
        var request = URLRequest(url: try url(for: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func url(for path: String) throws -> URL {
        guard let base = URL(string: baseURLString.trimmingCharacters(in: .whitespacesAndNewlines)),
              let url = URL(string: path, relativeTo: base)?.absoluteURL else {
            throw URLError(.badURL)
        }
        return url
    }

    private func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}
