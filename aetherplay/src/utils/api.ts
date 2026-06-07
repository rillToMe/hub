import type { App, Release } from "../types";
import { AuthStorage } from "./authStorage";

const API_BASE = "/api";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/* ── Public API ── */

export async function fetchPublicApps(): Promise<App[]> {
  const res = await fetch(`${API_BASE}/public/apps`);
  if (!res.ok) throw new Error(`Failed to load apps (${res.status})`);
  const data = await res.json();
  return data.apps ?? [];
}

export async function fetchLatestRelease(
  repo: string
): Promise<Release | null> {
  // Server expects :owner/:repo as separate path segments
  // repo is stored as "owner/repo" so we pass it directly
  try {
    const res = await fetch(
      `${API_BASE}/releases/latest/${repo}?t=${Date.now()}`,
      {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    if (!res.ok) throw new Error("API error");

    const data: Release = await res.json();

    const cacheKey = `release-${repo}`;
    sessionStorage.setItem(cacheKey, JSON.stringify(data));

    return data;
  } catch {
    const cached = sessionStorage.getItem(`release-${repo}`);
    return cached ? JSON.parse(cached) : null;
  }
}

export async function fetchReleases(repo: string): Promise<Release[]> {
  const cacheKey = `gh_releases_${repo}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (
        Date.now() - data.time < CACHE_TTL &&
        Array.isArray(data.releases)
      ) {
        return data.releases;
      }
    } catch {
      /* cache corrupted, refetch */
    }
  }

  const res = await fetch(`${API_BASE}/releases/${repo}`);
  if (!res.ok) throw new Error(`Failed to load releases (${res.status})`);

  const releases: Release[] = await res.json();

  localStorage.setItem(
    cacheKey,
    JSON.stringify({ time: Date.now(), releases })
  );

  return releases;
}

/* ── Admin API ── */

export async function loginAdmin(
  username: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Login failed (${res.status})`);
  }

  return res.json();
}

export async function fetchAdminApps(): Promise<App[]> {
  const token = AuthStorage.getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/apps`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    AuthStorage.clearToken();
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error("Failed to load data");

  const data = await res.json();
  return data.apps ?? [];
}

export async function saveAdminApps(apps: App[]): Promise<void> {
  const token = AuthStorage.getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ apps }),
  });

  if (res.status === 401) {
    AuthStorage.clearToken();
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error("Failed to save data");
}
