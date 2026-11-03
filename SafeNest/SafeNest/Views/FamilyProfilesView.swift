import SwiftUI

struct FamilyProfilesView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    SectionIntro(
                        title: "Family profiles",
                        subtitle: "Choose Senior or Kid for simpler words and fewer controls. You can change this anytime."
                    )
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 12, leading: 4, bottom: 8, trailing: 4))
                }

                Section("Modes") {
                    ForEach(FamilyProfile.allCases) { profile in
                        Button {
                            appModel.profile = profile
                            appModel.refreshAll()
                        } label: {
                            HStack(alignment: .top, spacing: 14) {
                                Image(systemName: profile.symbolName)
                                    .font(.title2)
                                    .foregroundStyle(SafeNestTheme.accent)
                                    .frame(width: 40, height: 40)
                                    .accessibilityHidden(true)

                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(profile.title)
                                            .font(.title3.weight(.semibold))
                                            .foregroundStyle(.primary)
                                        if appModel.profile == profile {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundStyle(SafeNestTheme.accent)
                                                .accessibilityLabel("Selected")
                                        }
                                    }
                                    Text(profile.shortDescription)
                                        .font(.body)
                                        .foregroundStyle(.secondary)
                                        .multilineTextAlignment(.leading)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(.vertical, 6)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(profile.title) mode. \(profile.shortDescription)")
                        .accessibilityAddTraits(appModel.profile == profile ? [.isSelected] : [])
                        .frame(minHeight: 56)
                    }
                }

                Section("Habits") {
                    Button("Show welcome tips again") {
                        appModel.resetOnboarding()
                    }
                    .font(.body.weight(.medium))
                    .frame(minHeight: 44)
                    .accessibilityHint("Reopens the one-habit-at-a-time onboarding")
                }
            }
            .navigationTitle("Family")
        }
    }
}
