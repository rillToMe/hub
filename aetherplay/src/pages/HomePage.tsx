import { useState, useEffect } from "react";
import type { App, Release } from "../types";
import { fetchPublicApps, fetchLatestRelease } from "../utils/api";
import AppCard from "../components/AppCard";
import SkeletonCard from "../components/SkeletonCard";

export default function HomePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [releases, setReleases] = useState<(Release | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const appList = await fetchPublicApps();
        if (cancelled) return;

        setApps(appList);

        const releaseResults = await Promise.all(
          appList.map((app) => fetchLatestRelease(app.repo))
        );

        if (!cancelled) {
          setReleases(releaseResults);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load apps:", err);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold text-hub-text mb-6">Applications</h1>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} variant="home" />
            ))
          : apps.map((app, i) => (
              <AppCard key={app.id} app={app} release={releases[i] ?? null} />
            ))}
      </div>
    </>
  );
}
