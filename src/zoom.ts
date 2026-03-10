export const ZOOM_OPTIONS = [1, 1.25, 1.5, 2] as const;
const ZOOM_STORAGE_KEY = "dashboard_zoom_level";

export function getSavedZoom() {
  if (typeof window === "undefined") return 1.5;
  const raw = window.localStorage.getItem(ZOOM_STORAGE_KEY);
  const parsed = raw ? Number(raw) : 1.5;
  if (!ZOOM_OPTIONS.includes(parsed as (typeof ZOOM_OPTIONS)[number])) return 1.5;
  return parsed;
}

export function applyZoom(level: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.zoom = `${Math.round(level * 100)}%`;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ZOOM_STORAGE_KEY, String(level));
  }
}

export function applyInitialZoom() {
  applyZoom(getSavedZoom());
}
