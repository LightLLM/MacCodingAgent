"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function BillingSuccess() {
  const [license, setLicense] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoLicense = params.get("license");
    const sessionId = params.get("session_id");
    const demoEmail = params.get("email");

    async function load() {
      try {
        if (demoLicense) {
          setLicense(demoLicense);
          setEmail(demoEmail);
          window.localStorage.setItem("mca.license", demoLicense);
          return;
        }
        if (!sessionId) {
          setError("Missing Stripe session.");
          return;
        }
        const res = await fetch(`/agent-api/billing/session/${sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load license");
        setLicense(data.license.licenseKey);
        setEmail(data.license.email);
        window.localStorage.setItem("mca.license", data.license.licenseKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment finalize failed");
      } finally {
        setLoading(false);
      }
    }

    void load().catch(() => {
      // Ensure demo licenses from the URL still surface if hydration hiccups.
      if (demoLicense) {
        setLicense(demoLicense);
        setEmail(demoEmail);
        setLoading(false);
      }
    });
  }, []);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Payment received</h1>
          <p>Stripe checkout completed and the backend issued your Pro license.</p>
        </div>
      </div>

      {loading ? <p>Finalizing with backend…</p> : null}
      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      {license ? (
        <div className="download-ready" data-testid="payment-success">
          <p>
            License key for {email ?? "your account"}:
            <br />
            <strong data-testid="issued-license">{license}</strong>
          </p>
          <div className="cta-row">
            <Link className="btn btn-solid" href="/download">
              Download macOS app
            </Link>
            <Link className="btn btn-primary" href="/app">
              Open agent
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
