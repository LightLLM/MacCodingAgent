"use client";

import { useEffect, useState, type FormEvent } from "react";
import { isEmail } from "@/lib/safe";

interface Plan {
  id: "pro_monthly" | "pro_lifetime";
  name: string;
  priceLabel: string;
  description: string;
  macDownload: boolean;
}

export function PricingPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [email, setEmail] = useState("");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/agent-api/billing/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans ?? []);
        setStripeConfigured(Boolean(data.stripeConfigured));
      })
      .catch(() => setError("Could not load pricing from backend"));
  }, []);

  async function startCheckout(plan: Plan["id"]) {
    setError(null);
    if (!isEmail(email)) {
      setError("Enter a valid email for the Stripe receipt.");
      return;
    }
    setBusyPlan(plan);
    try {
      const res = await fetch("/agent-api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusyPlan(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Pricing</h1>
          <p>
            Pay with Stripe for Pro — unlocks the macOS app download and connects
            billing to the Mac Coding Agent backend.
          </p>
        </div>
        <span className="status-pill">
          {stripeConfigured ? "Stripe connected" : "Demo checkout mode"}
        </span>
      </div>

      <form className="pay-email" onSubmit={onSubmit}>
        <label htmlFor="billing-email">Receipt email</label>
        <input
          id="billing-email"
          type="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="billing-email"
        />
      </form>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <div className="pricing-grid" data-testid="pricing-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="pricing-card">
            <h2>{plan.name}</h2>
            <p className="price">{plan.priceLabel}</p>
            <p>{plan.description}</p>
            <ul>
              <li>Stripe checkout + webhook sync</li>
              <li>Pro license key for Mac app</li>
              {plan.macDownload ? <li>macOS app download unlocked</li> : null}
              <li>Works with local Ollama / open-source models</li>
            </ul>
            <button
              type="button"
              className="btn btn-solid"
              disabled={busyPlan !== null}
              data-testid={`checkout-${plan.id}`}
              onClick={() => void startCheckout(plan.id)}
            >
              {busyPlan === plan.id ? "Redirecting…" : "Pay with Stripe"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
