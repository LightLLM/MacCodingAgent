import SwiftUI

struct MacRootView: View {
    @State private var urlString =
        UserDefaults.standard.string(forKey: "mca.webURL") ?? "http://127.0.0.1:3000/app"
    @State private var license =
        UserDefaults.standard.string(forKey: "mca.license") ?? ""

    var body: some View {
        NavigationSplitView {
            List {
                Section("Mac Coding Agent") {
                    Link("Agent", destination: URL(string: "http://127.0.0.1:3000/app")!)
                    Link("Pricing (Stripe)", destination: URL(string: "http://127.0.0.1:3000/pricing")!)
                    Link("Download", destination: URL(string: "http://127.0.0.1:3000/download")!)
                }
                Section("License") {
                    TextField("MCA-XXXX-…", text: $license)
                        .textFieldStyle(.roundedBorder)
                    Button("Save license") {
                        UserDefaults.standard.set(license, forKey: "mca.license")
                    }
                }
            }
            .navigationTitle("Mac Coding Agent")
        } detail: {
            VStack(alignment: .leading, spacing: 16) {
                Text("24/7 local coding agent")
                    .font(.largeTitle.bold())
                Text("This native macOS shell pairs with the Node agent daemon and Stripe-backed Pro licenses. Start `npm run dev` from the repo, then use Agent / Pricing / Download.")
                    .foregroundStyle(.secondary)
                if let url = URL(string: urlString) {
                    Link("Open dashboard", destination: url)
                        .buttonStyle(.borderedProminent)
                }
                Spacer()
            }
            .padding(28)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color(nsColor: .windowBackgroundColor))
        }
    }
}
