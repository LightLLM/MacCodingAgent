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
      if (!data.macDownloadUnlocked) {
        setError("This license does not unlock the macOS download yet. Purchase Pro first.");
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
            Install Mac Coding Agent on your Mac — the desktop shell runs the
            24/7 agent locally and opens the dashboard.
          </p>
        </div>
      </div>

      <div className="download-panel">
        <label htmlFor="license-key">Pro license key</label>
        <div className="download-row">
          <input
            id="license-key"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            placeholder="MCA-XXXX-XXXX-XXXX-XXXX"
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

        {entitlements?.macDownloadUnlocked ? (
          <div className="download-ready" data-testid="download-ready">
            <p>
              License <strong>{entitlements.licenseKey}</strong> unlocks macOS
              download ({entitlements.plan}).
            </p>
            <a
              className="btn btn-solid"
              href="/downloads/MacCodingAgent-macOS.zip"
              download
              data-testid="macos-download-link"
            >
              Download macOS app
            </a>
            <ol>
              <li>Unzip <code>MacCodingAgent-macOS.zip</code></li>
              <li>Open <code>Mac Coding Agent.app</code> (or run <code>./start-mac-coding-agent.sh</code>)</li>
              <li>Enter your license key in Settings if prompted</li>
            </ol>
          </div>
        ) : (
          <p className="download-hint">
            Need a license? <a href="/pricing">Pay with Stripe</a> to unlock the
            Mac download.
          </p>
        )}

        <div className="mono-panel download-sysreq">
{`Requirements
• macOS 13 Ventura or later (Apple Silicon or Intel)
• Node.js 20+ (bundled launcher can use system Node)
• Optional: Ollama or LM Studio for local models`}
        </div>
      </div>
    </div>
  );
}
