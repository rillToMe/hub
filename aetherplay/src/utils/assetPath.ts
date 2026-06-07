/**
 * Normalizes legacy asset paths from the old Vanilla project structure.
 * Old: "assets/img/foo.png" → New: "/img/foo.png" (served from public/)
 * Absolute URLs (http/https) and already-correct paths are left unchanged.
 */
export function resolveAssetPath(path: string): string {
  if (!path) return "";
  // Already absolute URL (http/https) → pass through
  if (/^https?:\/\//.test(path)) return path;
  // Already correct (starts with /) → pass through
  if (path.startsWith("/")) return path;
  // Strip leading "assets/" prefix → remap to public root
  return "/" + path.replace(/^assets\//, "");
}
