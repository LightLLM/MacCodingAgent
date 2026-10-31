import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-label="Mac Coding Agent hero">
        <div className="hero-visual" aria-hidden />
        <div className="hero-copy">
          <p className="hero-brand">Mac Coding Agent</p>
          <h1>Always-on coding on your Mac, with models that stay local.</h1>
          <p>
            Run a 24/7 coding agent on macOS. Pair Ollama or LM Studio, ship from
            the web dashboard, and keep an eye on tasks from your iPhone.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/app">
              Open agent
            </Link>
            <Link className="btn btn-ghost" href="/models">
              Choose local model
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Built to stay up</h2>
        <p>
          One daemon on your Mac keeps sessions, model routing, and coding tasks
          alive overnight — no cloud lock-in required.
        </p>
        <div className="feature-rail">
          <div className="feature-lead">
            <h3>Local-first inference</h3>
            <p>
              Point Mac Coding Agent at Ollama, LM Studio, or any OpenAI-compatible
              endpoint. When nothing is reachable, a stub model keeps the loop
              online so you can still design workflows and test the clients.
            </p>
          </div>
          <pre className="mono-panel">{`npm install
npm run dev

# Agent API  → :8787
# Web app    → :3000
# iPhone     → Xcode project in /ios`}</pre>
        </div>
      </section>
    </>
  );
}
