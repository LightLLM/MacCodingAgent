"use client";

import { useEffect, useState } from "react";
import { fetchProjects } from "@/lib/api";
import type { ProjectInfo } from "@/lib/types";

export function ProjectsPanel() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchProjects()
      .then((data) => setProjects(data.projects))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load projects"),
      );
  }, []);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Projects</h1>
          <p>Local workspaces Mac Coding Agent can keep warm overnight.</p>
        </div>
      </div>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <div className="projects-grid" data-testid="projects-grid">
        {projects.map((project) => (
          <article key={project.id} className="project-row">
            <div>
              <h3>{project.name}</h3>
              <p>
                {project.language} · {project.path}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
