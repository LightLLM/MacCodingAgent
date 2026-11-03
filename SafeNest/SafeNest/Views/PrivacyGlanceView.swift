import SwiftUI

struct PrivacyGlanceView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    SectionIntro(
                        title: appModel.profile.prefersSimplifiedCopy ? "Who can see what" : "Privacy glance",
                        subtitle: appModel.profile.hidesAdvancedPrivacyDetail
                            ? "A short list of permissions worth reviewing with a parent or helper."
                            : "A calm look at permissions that often need attention. Sample data until entitlements land."
                    )
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 12, leading: 4, bottom: 8, trailing: 4))
                }

                Section {
                    ForEach(appModel.privacyItems) { item in
                        privacyRow(item)
                    }
                } footer: {
                    Text("All rows are labeled sample/demo. SafeNest does not read private TCC databases in this scaffold.")
                        .font(.footnote)
                }
            }
            .navigationTitle("Privacy")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        appModel.refreshAll()
                    } label: {
                        Label("Refresh", systemImage: "arrow.clockwise")
                    }
                    .accessibilityLabel("Refresh privacy list")
                }
            }
        }
    }

    private func privacyRow(_ item: PrivacyItem) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.name)
                    .font(.title3.weight(.semibold))
                Spacer()
                Text(item.attention.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(tint(for: item.attention))
            }
            Text(item.category)
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
            Text(item.detail)
                .font(.body)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
            Text(item.suggestedAction)
                .font(.callout)
                .foregroundStyle(.secondary)
            if item.isStubbed {
                Text("Sample data")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(item.accessibilitySummary)
    }

    private func tint(for attention: PrivacyAttention) -> Color {
        switch attention {
        case .ok: return .green
        case .review: return .orange
        case .unknown: return .secondary
        }
    }
}
