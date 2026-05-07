const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
);
