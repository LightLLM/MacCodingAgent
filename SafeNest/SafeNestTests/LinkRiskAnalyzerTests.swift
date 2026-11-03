import XCTest
@testable import SafeNest

final class LinkRiskAnalyzerTests: XCTestCase {
    private let analyzer = LinkRiskAnalyzer()

    func testEmptyReturnsEmptyResult() {
        let result = analyzer.analyze("   ")
        XCTAssertEqual(result.headline, LinkRiskResult.empty.headline)
        XCTAssertTrue(result.signals.isEmpty)
    }

    func testUrgencyAndGiftCardIsHighRisk() {
        let text = "URGENT: Your account locked! Buy a gift card and send code now: http://verify-account.tk/login"
        let result = analyzer.analyze(text)
        XCTAssertEqual(result.level, .high)
        XCTAssertFalse(result.signals.isEmpty)
    }

    func testLookalikeDomainRaisesRisk() {
        let result = analyzer.analyze("Please sign in at https://arnazon-security.xyz/account")
        XCTAssertTrue(result.level == .caution || result.level == .high)
        XCTAssertTrue(result.signals.contains { $0.label.lowercased().contains("lookalike") || $0.detail.lowercased().contains("amazon") })
    }

    func testBenignHttpsSiteIsLow() {
        let result = analyzer.analyze("Here is the recipe site https://www.apple.com/newsroom/")
        XCTAssertEqual(result.level, .low)
    }
}
