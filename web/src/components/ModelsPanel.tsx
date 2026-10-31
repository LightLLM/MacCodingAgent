"use client";

import { useEffect, useState } from "react";
import { fetchModels, setActiveModel } from "@/lib/api";
import type { ModelInfo } from "@/lib/types";

export function ModelsPanel() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>("");
  const [reachable, setReachable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchModels()
      .then((data) => {
        setModels(data.models);
        setActiveModelId(data.activeModelId);
        setReachable(data.localModelsReachable);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load models"),
      );
  }, []);

  async function activate(modelId: string) {
    setBusy(true);
    try {
      await setActiveModel(modelId);
      setActiveModelId(modelId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch model");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Models</h1>
          <p>
            Open-source and local providers
            {reachable ? " · Ollama/compatible reachable" : " · using stub models"}
          </p>
        </div>
      </div>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <div className="models-grid" data-testid="models-grid">
        {models.map((model) => (
          <article key={model.id} className="model-row">
            <div>
              <h3>{model.name}</h3>
              <p>
                {model.provider} · {model.description}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-solid"
              disabled={busy || model.id === activeModelId}
              onClick={() => void activate(model.id)}
            >
              {model.id === activeModelId ? "Active" : "Use"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
