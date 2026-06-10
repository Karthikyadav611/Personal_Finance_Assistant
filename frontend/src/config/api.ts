const normalizeBaseUrl = (value: string) => {
  let normalized = String(value || "").trim().replace(/\/+$/, "");

  // Some deployments/configs mistakenly set the base URL to ".../api".
  // Our frontend sometimes appends "/api/..." itself (reports/uploads),
  // so strip a trailing "/api" to avoid double-prefixing ("/api/api/...").
  if (normalized.toLowerCase().endsWith("/api")) {
    normalized = normalized.slice(0, -4);
  }

  return normalized;
};

export const API_BASE_URL = normalizeBaseUrl(
  // Backwards-compatible: some deployments use VITE_API_URL.
  // Prefer VITE_API_BASE_URL going forward.
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
);
