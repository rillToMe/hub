export const PLATFORM_META: Record<
  string,
  { label: string; icon: string }
> = {
  windows: { label: "Windows", icon: "fa-windows" },
  macos: { label: "macOS", icon: "fa-apple" },
  linux: { label: "Linux", icon: "fa-linux" },
  android: { label: "Android", icon: "fa-android" },
  ios: { label: "iOS", icon: "fa-apple" },
  web: { label: "Web", icon: "fa-globe" },
};

export function detectPlatform(
  filename: string
): { key: string; label: string; icon: string } {
  const f = filename.toLowerCase();

  if (f.match(/\.exe|\.msi|\.msix|win/)) return { key: "windows", ...PLATFORM_META.windows };
  if (f.match(/\.dmg|\.pkg|mac|darwin/)) return { key: "macos", ...PLATFORM_META.macos };
  if (f.match(/\.deb|\.rpm|\.appimage|linux/)) return { key: "linux", ...PLATFORM_META.linux };
  if (f.match(/\.apk/)) return { key: "android", ...PLATFORM_META.android };
  if (f.match(/\.ipa/)) return { key: "ios", ...PLATFORM_META.ios };
  if (f.match(/\.html|\.wasm|web/)) return { key: "web", label: "Web", icon: "fa-globe" };

  return { key: "other", label: "Other", icon: "fa-download" };
}

export function detectType(
  filename: string
): { label: string; icon: string } {
  const f = filename.toLowerCase();

  if (f.match(/setup|installer|\.msi|\.msix/))
    return { label: "Installer", icon: "fa-box-open" };
  if (f.match(/portable/))
    return { label: "Portable", icon: "fa-suitcase" };

  return { label: "Download", icon: "fa-download" };
}

export function getUserOS(): string | null {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macos";
  if (ua.includes("linux")) return "linux";

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getPlatformSuffix(
  items: { name: string }[]
): string {
  const types = new Set<string>();

  items.forEach((asset) => {
    types.add(detectType(asset.name).label);
  });

  if (types.has("Installer") && types.has("Portable"))
    return " (Installer & Portable)";

  return "";
}
