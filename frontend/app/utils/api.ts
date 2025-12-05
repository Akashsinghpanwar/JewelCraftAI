const base =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

export const apiUrl = (path: string) =>
  `${base}${path.startsWith("/") ? path : `/${path}`}`;
