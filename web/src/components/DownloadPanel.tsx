"use client";

import { useEffect, useState } from "react";

interface Entitlements {
  plan: string;
  status: string;
  pro: boolean;
  macDownloadUnlocked: boolean;
  licenseKey: string | null;
  email: string | null;
}

export function DownloadPanel() {
  const [license, setLicense] = useState("");
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("mca.license")
        : null;
    if (saved) setLicense(saved);
  }, []);

  async function verify() {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(
        `/agent-api/billing/entitlements?license=${encodeURIComponent(license.trim())}`,
      );
      const data = (await res.json()) as Entitlements;
      setEntitlements(data);
      if (data.licenseKey) {
        window.localStorage.setItem("mca.license", data.licenseKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify license");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Download for macOS</h1>
          <p>
            Install Mac Coding Agent on your Mac Mini — desktop app with a local
            embedded agent for the latest macOS.
          </p>
        </div>
      </div>

      <div className="download-panel">
        <div className="download-ready" data-testid="download-ready">
          <p>
            <strong>Mac Coding Agent for Mac Mini / macOS 13+</strong>
            <br />
            Includes Apple Silicon + Intel runtimes, Installer, and local agent.
          </p>
          <a
            className="btn btn-solid"
            href="/downloads/MacCodingAgent-macOS-latest.zip"
            download
            data-testid="macos-download-link"
          >
            Download macOS app (latest)
          </a>
          <ol>
            <li>Unzip <code>MacCodingAgent-macOS-latest.zip</code></li>
            <li>
              Double-click <code>Install Mac Coding Agent.command</code>
            </li>
            <li>
              If macOS blocks it: right-click → Open → Open (Gatekeeper)
            </li>
            <li>App installs to <code>/Applications</code> and launches</li>
          </ol>
        </div>

        <div className="mono-panel download-sysreq">
{`Mac Mini install notes
• macOS 13 Ventura or later (Sonoma / Sequoia OK)
• Apple Silicon (M1–M4) or Intel
• First launch may need right-click → Open
• Embedded agent listens on localhost — works offline
• Optional: install Ollama for open-source models`}
        </div>

        <label htmlFor="license-key">Optional Pro license</label>
        <div className="download-row">
          <input
            id="license-key"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            placeholder="MCA1.… signed Pro license"
            data-testid="license-input"
          />
          <button
            type="button"
            className="btn btn-solid"
            onClick={() => void verify()}
            disabled={checking || !license.trim()}
          >
            {checking ? "Checking…" : "Verify"}
          </button>
        </div>
        {error ? (
          <div className="error-banner" role="alert">
            {error}
          </div>
        ) : null}
        {entitlements?.pro ? (
          <p className="download-hint">
            Pro active for {entitlements.email ?? "this license"} (
            {entitlements.plan}).
          </p>
        ) : (
          <p className="download-hint">
            Want Pro billing sync? <a href="/pricing">Pay with Stripe</a>.
          </p>
        )}
      </div>
    </div>
  );
}
