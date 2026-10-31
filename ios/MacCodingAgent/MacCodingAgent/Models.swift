import Foundation

struct AgentHealth: Codable, Equatable {
    let name: String
    let version: String
    let status: String
    let uptimeSeconds: Int
    let startedAt: String
    let modelProvider: String
    let activeModel: String
    let sessions: Int
    let tasksQueued: Int
    let tasksRunning: Int
    let localModelsReachable: Bool
}

struct ModelInfo: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let provider: String
    let available: Bool
    let description: String
}

struct ChatMessage: Codable, Identifiable, Equatable {
    let id: String
    let role: String
    let content: String
    let createdAt: String
}

struct Session: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let projectPath: String?
    let modelId: String
    let messages: [ChatMessage]
    let createdAt: String
    let updatedAt: String
}

struct ProjectInfo: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let path: String
    let language: String
    let lastOpenedAt: String
}

struct ModelsResponse: Codable {
    let models: [ModelInfo]
    let activeModelId: String
    let localModelsReachable: Bool
}

struct SessionsResponse: Codable {
    let sessions: [Session]
}

struct SessionResponse: Codable {
    let session: Session
}

struct ChatResponse: Codable {
    let reply: String
    let session: Session
    let taskId: String
}

struct ProjectsResponse: Codable {
    let projects: [ProjectInfo]
}
