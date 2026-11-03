import SwiftUI

struct LinkHelperView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var draft: String = ""
    @FocusState private var editorFocused: Bool

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    SectionIntro(
                        title: appModel.profile.prefersSimplifiedCopy ? "Is this link safe?" : "Link & message helper",
                        subtitle: "Paste a web address or a whole message. SafeNest explains risk in plain English — on this device only."
                    )

                    TextEditor(text: $draft)
                        .font(.title3)
                        .frame(minHeight: 140)
                        .padding(12)
                        .background(.background, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .strokeBorder(.secondary.opacity(0.25), lineWidth: 1)
                        )
                        .focused($editorFocused)
                        .accessibilityLabel("Message or link to check")
                        .accessibilityHint("Paste or type the text you want SafeNest to review")

                    LargePrimaryButton(title: "Check this", systemImage: "magnifyingglass") {
                        appModel.analyzeLinkOrMessage(draft)
                        editorFocused = false
                    }
                    .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityHint("Runs a local safety check")

                    resultBlock

                    Text("SafeNest never opens the link for you and never downloads files from it.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(24)
            }
            .background(SafeNestTheme.wash.ignoresSafeArea())
            .navigationTitle("Links")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Clear") {
                        draft = ""
                        appModel.lastLinkResult = .empty
                    }
                    .disabled(draft.isEmpty && appModel.lastLinkResult.signals.isEmpty)
                    .accessibilityLabel("Clear text and results")
                }
            }
        }
    }

    private var resultBlock: some View {
        let result = appModel.lastLinkResult
        return VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                Image(systemName: result.level.systemImage)
                    .font(.largeTitle)
                    .foregroundStyle(tint(for: result.level))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text(result.level.title)
                        .font(.title2.weight(.bold))
                    Text(result.headline)
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
            }

            Text(result.explanation)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)

            if !result.signals.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("What we noticed")
                        .font(.headline)
                    ForEach(result.signals) { signal in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(signal.label)
                                .font(.body.weight(.semibold))
                            Text(signal.detail)
                                .font(.callout)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                        .accessibilityElement(children: .combine)
                    }
                }
            }

            if !result.advice.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("What to do")
                        .font(.headline)
                    ForEach(result.advice, id: \.self) { line in
                        Label(line, systemImage: "checkmark.circle")
                            .font(.body)
                            .labelStyle(.titleAndIcon)
                            .accessibilityElement(children: .combine)
                    }
                }
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityElement(children: .contain)
    }

    private func tint(for level: RiskLevel) -> Color {
        switch level {
        case .low: return .green
        case .caution: return .orange
        case .high: return .red
        }
    }
}
