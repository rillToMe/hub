import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import type { App, Release, ReleaseAsset } from "../types";
import { fetchPublicApps, fetchLatestRelease } from "../utils/api";
import { resolveAssetPath } from "../utils/assetPath";
import {
  PLATFORM_META,
  detectPlatform,
  detectType,
  getUserOS,
  formatBytes,
  getPlatformSuffix,
} from "../utils/platformUtils";

/** Normalize a value that might be an object to a string safely */
function safeStr(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  // Object with .name field (e.g. if DB stored nested objects)
  if (typeof val === "object" && "name" in (val as object))
    return String((val as Record<string, unknown>).name);
  return "";
}

/** Normalize platforms: could be string[] or object[] from DB */
function safePlatforms(platforms: unknown): string[] {
  if (!Array.isArray(platforms)) return [];
  return platforms.map((p) => {
    if (typeof p === "string") return p;
    if (p && typeof p === "object" && "name" in p)
      return String((p as Record<string, unknown>).name);
    return String(p);
  });
}

export default function AppDetailPage() {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get("id");

  const [app, setApp] = useState<App | null>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) {
      setError("No app ID specified.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const apps = await fetchPublicApps();
        const found = apps.find((a) => a.id === appId);

        if (!found) {
          if (!cancelled) setError("App not found.");
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) setApp(found);

        const rel = await fetchLatestRelease(found.repo);
        if (!cancelled) {
          setRelease(rel);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <div className="bg-hub-card border border-hub-border rounded-[18px] p-7 animate-pulse">
          <div className="h-8 bg-hub-border rounded w-1/3 mb-4" />
          <div className="h-4 bg-hub-border rounded w-2/3 mb-6" />
          <div className="h-48 bg-hub-border rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-[1100px] mx-auto text-center py-20">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-error mb-4" />
        <p className="text-hub-text/70 text-lg">{error || "App not found."}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-hub-accent text-hub-bg rounded-xl font-semibold no-underline hover:shadow-lg transition-shadow"
        >
          <i className="fa-solid fa-arrow-left" /> Back to Home
        </Link>
      </div>
    );
  }

  const version = release?.tag_name ?? "N/A";
  const userOS = getUserOS();

  // Normalize potentially-bad API fields
  const appName = safeStr(app.name) || "Unknown App";
  const appDeveloper = safeStr(app.developer) || "Unknown";
  const appLicense = safeStr(app.license) || "N/A";
  const appRepo = safeStr(app.repo);
  const appDescription = safeStr(app.description);
  const appPlatforms = safePlatforms(app.platforms);
  const appOpensource = Boolean(app.opensource);

  // Group assets by platform
  const grouped: Record<string, ReleaseAsset[]> = {};
  if (release?.assets) {
    release.assets.forEach((asset) => {
      const p = detectPlatform(asset.name);
      if (!grouped[p.key]) grouped[p.key] = [];
      grouped[p.key].push(asset);
    });
  }

  return (
    <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-8 items-start">
      {/* Main Column */}
      <div className="bg-hub-card border border-hub-border rounded-[18px] p-7">
        {app.thumbnail && (
          <img
            src={resolveAssetPath(app.thumbnail)}
            alt={appName}
            className="w-[120px] h-[120px] object-cover rounded-2xl mb-5"
          />
        )}

        <h1 className="text-2xl font-bold text-hub-text mb-2">{appName}</h1>
        <p className="text-hub-text/75 leading-relaxed mb-4">{appDescription}</p>

        {/* Download Buttons */}
        {release && Object.keys(grouped).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-hub-text mb-3">
              <i className="fa-solid fa-download mr-2" />
              Downloads — {version}
            </h3>
            <div className="flex flex-col gap-3">
              {Object.entries(grouped).map(([platformKey, assets]) => {
                const meta =
                  PLATFORM_META[platformKey] ?? detectPlatform(assets[0].name);
                const isUserPlatform = userOS === platformKey;
                const suffix = getPlatformSuffix(assets);

                return (
                  <div key={platformKey}>
                    <div
                      className={`text-[0.9rem] font-medium mb-1.5 ${
                        isUserPlatform ? "text-hub-accent" : "text-hub-text/70"
                      }`}
                    >
                      <i className={`fa-brands ${meta.icon} mr-1.5`} />
                      {meta.label}
                      {suffix}
                      {isUserPlatform && (
                        <span className="ml-2 text-[0.75rem] px-2 py-0.5 bg-hub-accent/15 text-hub-accent rounded-full">
                          Your OS
                        </span>
                      )}
                    </div>
                    {assets.map((asset) => {
                      const type = detectType(asset.name);
                      return (
                        <a
                          key={asset.name}
                          href={asset.browser_download_url}
                          className="flex items-center gap-2 px-4 py-2.5 mb-1.5 rounded-xl bg-white/[0.04] border border-hub-border text-hub-accent no-underline text-[0.85rem] hover:border-hub-accent hover:bg-hub-accent/[0.06] transition-colors"
                        >
                          <i className={`fa-solid ${type.icon}`} />
                          <span className="truncate flex-1">{asset.name}</span>
                          <span className="text-hub-text/40 text-[0.75rem] shrink-0">
                            {formatBytes(asset.size)}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-5 md:order-none order-first">
        {/* Info Card */}
        <div className="bg-hub-card border border-hub-border rounded-[18px] p-5">
          <h3 className="text-[1.05rem] font-semibold text-hub-text mb-3">
            App Info
          </h3>
          <ul className="list-none p-0 m-0 space-y-2 text-[0.95rem] text-hub-text/85">
            <li>
              <strong>Developer:</strong> {appDeveloper}
            </li>
            <li>
              <strong>License:</strong> {appLicense}
            </li>
            <li>
              <strong>Version:</strong>{" "}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1f2937] border border-hub-border rounded text-[0.9rem] text-hub-accent">
                <i className="fa-solid fa-tag" />
                {version}
              </span>
            </li>
            <li>
              <strong>Open Source:</strong>{" "}
              {appOpensource ? (
                <span className="text-success">Yes</span>
              ) : (
                <span className="text-hub-text/50">No</span>
              )}
            </li>
          </ul>
        </div>

        {/* Platform Card */}
        <div className="bg-hub-card border border-hub-border rounded-[18px] p-5">
          <h3 className="text-[1.05rem] font-semibold text-hub-text mb-3">
            Platforms
          </h3>
          <div className="flex flex-wrap gap-2">
            {appPlatforms.length > 0 ? (
              appPlatforms.map((p) => {
                const meta = PLATFORM_META[p];
                return (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-hub-border/50 rounded-lg text-[0.85rem] text-hub-text/80"
                  >
                    {meta && <i className={`fa-brands ${meta.icon}`} />}
                    {meta?.label ?? p}
                  </span>
                );
              })
            ) : (
              <span className="text-hub-text/50 text-sm">N/A</span>
            )}
          </div>
        </div>

        {/* Repository Card */}
        <div className="bg-hub-card border border-hub-border rounded-[18px] p-5">
          <h3 className="text-[1.05rem] font-semibold text-hub-text mb-3">
            Repository
          </h3>
          <a
            href={`https://github.com/${appRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-hub-accent no-underline hover:underline text-[0.95rem]"
          >
            <i className="fa-brands fa-github" />
            {appRepo}
          </a>
        </div>
      </div>
    </div>
  );
}
