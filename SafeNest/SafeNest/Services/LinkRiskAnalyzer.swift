import Foundation

/// Local-only heuristics. Does not fetch URLs, execute content, or run exploits.
struct LinkRiskAnalyzer {
    private let lookalikes: [(bait: String, real: String)] = [
        ("arnazon", "amazon"),
        ("amaz0n", "amazon"),
        ("paypa1", "paypal"),
        ("paypai", "paypal"),
        ("app1e", "apple"),
        ("appie", "apple"),
        ("micr0soft", "microsoft"),
        ("faceb00k", "facebook"),
        ("g00gle", "google"),
        ("netf1ix", "netflix"),
        ("wellsfarg0", "wellsfargo"),
        ("bankofamerica-secure", "bankofamerica")
    ]

    private let urgencyPhrases = [
        "account locked",
        "account suspended",
        "verify immediately",
        "act now",
        "final notice",
        "wire money",
        "gift card",
        "bitcoin",
        "crypto",
        "send code",
        "one-time password",
        "password expires",
        "click here now",
        "urgent action",
        "legal action",
        "you have won",
        "claim your prize"
    ]

    private let suspiciousTLDs: Set<String> = [
        "zip", "mov", "tk", "gq", "ml", "cf", "top", "xyz", "country", "click", "loan"
    ]

    private let shortenerHosts: Set<String> = [
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly"
    ]

    func analyze(_ raw: String) -> LinkRiskResult {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return .empty }

        var signals: [RiskSignal] = []
        var score = 0

        let lower = text.lowercased()
        let urls = extractURLs(from: text)

        if urls.isEmpty, looksLikeBareDomain(lower) {
            signals.append(RiskSignal(
                id: "bare-domain",
                label: "Looks like a web address",
                detail: "There is no https:// prefix. Confirm the spelling carefully."
            ))
            score += 1
        }

        for url in urls {
            score += scoreURL(url, signals: &signals)
        }

        for phrase in urgencyPhrases where lower.contains(phrase) {
            signals.append(RiskSignal(
                id: "urgency-\(phrase)",
                label: "Urgent or scary wording",
                detail: "Found “\(phrase)”. Scams often rush you so you won’t think."
            ))
            score += 2
        }

        if lower.contains("password") || lower.contains("ssn") || lower.contains("social security") {
            signals.append(RiskSignal(
                id: "secrets",
                label: "Asks for private information",
                detail: "Real companies rarely ask for passwords or ID numbers by surprise message."
            ))
            score += 3
        }

        for pair in lookalikes where lower.contains(pair.bait) {
            signals.append(RiskSignal(
                id: "lookalike-\(pair.bait)",
                label: "Possible lookalike name",
                detail: "“\(pair.bait)” may be pretending to be \(pair.real)."
            ))
            score += 3
        }

        let level: RiskLevel
        switch score {
        case 0...1: level = .low
        case 2...4: level = .caution
        default: level = .high
        }

        let headline: String
        switch level {
        case .low: headline = "No strong warning signs"
        case .caution: headline = "Some warning signs"
        case .high: headline = "This looks like a scam pattern"
        }

        let explanation: String
        if signals.isEmpty {
            explanation = "SafeNest did not find common scam patterns in this text. That does not guarantee safety — only open links you trust."
        } else {
            explanation = "Checked on this device only. Here is what stood out, in plain English."
        }

        return LinkRiskResult(
            id: UUID(),
            level: level,
            headline: headline,
            explanation: explanation,
            signals: signals,
            advice: advice(for: level),
            analyzedAt: Date()
        )
    }

    private func advice(for level: RiskLevel) -> [String] {
        switch level {
        case .low:
            return [
                "Still double-check the sender.",
                "Prefer typing a site address yourself instead of tapping a link."
            ]
        case .caution:
            return [
                "Do not enter passwords from this message.",
                "Call the company using a number you already know — not one from the message.",
                "Ask a family member if you feel unsure."
            ]
        case .high:
            return [
                "Do not tap the link.",
                "Do not send money, gift cards, or codes.",
                "Delete the message or report it as junk.",
                "If you already shared a password, change it on a site you typed yourself."
            ]
        }
    }

    private func extractURLs(from text: String) -> [URL] {
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else {
            return []
        }
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        return detector.matches(in: text, options: [], range: range).compactMap(\.url)
    }

    private func looksLikeBareDomain(_ lower: String) -> Bool {
        lower.contains(".") && !lower.contains(" ") && lower.count < 80
    }

    private func scoreURL(_ url: URL, signals: inout [RiskSignal]) -> Int {
        var score = 0
        let host = (url.host ?? "").lowercased()
        let scheme = (url.scheme ?? "").lowercased()

        if scheme != "https" && scheme != "http" && !scheme.isEmpty {
            signals.append(RiskSignal(
                id: "scheme-\(scheme)",
                label: "Unusual link type",
                detail: "This uses “\(scheme):” instead of a normal web link."
            ))
            score += 2
        }

        if scheme == "http" {
            signals.append(RiskSignal(
                id: "http",
                label: "Not a secure (https) link",
                detail: "The address does not use https. Prefer sites that show a lock in the browser."
            ))
            score += 1
        }

        if host.isEmpty == false {
            if isIPLiteral(host) {
                signals.append(RiskSignal(
                    id: "ip-host",
                    label: "Link uses a number address",
                    detail: "Trusted sites usually use a name (like apple.com), not raw numbers."
                ))
                score += 3
            }

            if let tld = host.split(separator: ".").last.map(String.init),
               suspiciousTLDs.contains(tld) {
                signals.append(RiskSignal(
                    id: "tld-\(tld)",
                    label: "Uncommon website ending",
                    detail: ".“\(tld)” shows up often in throwaway scam sites."
                ))
                score += 2
            }

            if shortenerHosts.contains(host) {
                signals.append(RiskSignal(
                    id: "shortener-\(host)",
                    label: "Shortened link",
                    detail: "Short links hide the real destination. Ask the sender for the full address."
                ))
                score += 2
            }

            if host.contains("login") || host.contains("secure-update") || host.contains("verify-account") {
                signals.append(RiskSignal(
                    id: "keyword-host",
                    label: "Login-looking website name",
                    detail: "Scam sites often put words like “login” or “verify” in the address."
                ))
                score += 2
            }

            let parts = host.split(separator: ".")
            if parts.count >= 4 {
                signals.append(RiskSignal(
                    id: "long-host",
                    label: "Very long website name",
                    detail: "Extra words before the real name can hide a fake site."
                ))
                score += 1
            }
        }

        if (url.user != nil) || textHasAtInAuthority(url) {
            signals.append(RiskSignal(
                id: "at-sign",
                label: "Tricky @ in the link",
                detail: "An @ in a web address can hide where the link really goes."
            ))
            score += 3
        }

        return score
    }

    private func isIPLiteral(_ host: String) -> Bool {
        let trimmed = host.trimmingCharacters(in: CharacterSet(charactersIn: "[]"))
        let v4 = trimmed.split(separator: ".")
        if v4.count == 4, v4.allSatisfy({ UInt8($0) != nil }) { return true }
        return trimmed.contains(":")
    }

    private func textHasAtInAuthority(_ url: URL) -> Bool {
        guard let raw = url.absoluteString.split(separator: "://").last else { return false }
        let authority = raw.split(separator: "/").first.map(String.init) ?? ""
        return authority.contains("@")
    }
}
