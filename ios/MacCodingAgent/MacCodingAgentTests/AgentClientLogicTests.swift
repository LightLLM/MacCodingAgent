import XCTest
@testable import MacCodingAgent

final class AgentClientLogicTests: XCTestCase {
    func testAgentHealthDecoding() throws {
        let json = """
        {
          "name": "Mac Coding Agent",
          "version": "1.0.0",
          "status": "running",
          "uptimeSeconds": 12,
          "startedAt": "2026-10-31T00:00:00.000Z",
          "modelProvider": "stub",
          "activeModel": "stub-coder",
          "sessions": 1,
          "tasksQueued": 0,
          "tasksRunning": 0,
          "localModelsReachable": false
        }
        """.data(using: .utf8)!

        let health = try JSONDecoder().decode(AgentHealth.self, from: json)
        XCTAssertEqual(health.name, "Mac Coding Agent")
        XCTAssertEqual(health.status, "running")
        XCTAssertEqual(health.activeModel, "stub-coder")
    }

    func testSessionDecodingIncludesMessages() throws {
        let json = """
        {
          "id": "abc",
          "title": "Ship iPhone app",
          "projectPath": null,
          "modelId": "stub-coder",
          "messages": [
            {
              "id": "m1",
              "role": "user",
              "content": "hello",
              "createdAt": "2026-10-31T00:00:00.000Z"
            }
          ],
          "createdAt": "2026-10-31T00:00:00.000Z",
          "updatedAt": "2026-10-31T00:00:00.000Z"
        }
        """.data(using: .utf8)!

        let session = try JSONDecoder().decode(Session.self, from: json)
        XCTAssertEqual(session.title, "Ship iPhone app")
        XCTAssertEqual(session.messages.count, 1)
        XCTAssertEqual(session.messages[0].content, "hello")
    }
}
