const LAST_PROJECT_KEY = "qatarina.last-project-id";

export function getLastProjectId() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function getLastProjectPath() {
  const projectId = getLastProjectId();
  return projectId ? `/projects/${projectId}` : null;
}

export function setLastProjectId(projectId: string | number | null) {
  if (typeof window === "undefined") return;
  try {
    if (projectId === null || projectId === undefined || projectId === "") {
      localStorage.removeItem(LAST_PROJECT_KEY);
      return;
    }
    localStorage.setItem(LAST_PROJECT_KEY, String(projectId));
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
}
