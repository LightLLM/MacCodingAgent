import SwiftUI

struct CheckRow: View {
    let item: SecurityCheckItem

    private var tint: Color {
        switch item.status {
        case .pass: return .green
        case .attention: return .orange
        case .learn: return .blue
        case .unknown: return .secondary
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: item.status.systemImage)
                    .font(.title2)
                    .foregroundStyle(tint)
                    .frame(width: 36, height: 36)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 6) {
                    Text(item.title)
                        .font(.title3.weight(.semibold))
                    Text(item.status.title)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(tint)
                    Text(item.whyItMatters)
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(item.howToFix)
                        .font(.callout)
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                    if item.isStubbed {
                        Text("Demo status — real device check coming later")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(.vertical, 8)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(item.accessibilitySummary)
    }
}
