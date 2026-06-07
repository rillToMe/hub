import { useState, useCallback } from "react";
import type { App, Release } from "../types";
import { fetchReleases } from "../utils/api";
import { formatBytes, detectPlatform } from "../utils/platformUtils";
import SkeletonCard from "./SkeletonCard";

interface RepoCardProps {
  app: App;
}

export default function RepoCard({ app }: RepoCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);

    if (!hasLoaded) {
      setHasLoaded(true);
      setIsLoading(true);
      setError(null);

      fetchReleases(app.repo)
        .then((data) => setReleases(data))
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [hasLoaded, app.repo]);

  return (
    <div className="bg-hub-card rounded-2xl p-4 border border-hub-border">
      {/* Header — click to toggle */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between cursor-pointer bg-transparent border-none text-hub-text p-0"
      >
        <span className="text-[1.1rem] font-semibold">{app.name}</span>
        <span
          className={`text-[1.4rem] transition-transform duration-250 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <i className="fa-solid fa-chevron-down" />
        </span>
      </button>

      {/* Release Panel */}
      {isOpen && (
        <div className="mt-[14px] animate-[fade-slide_0.3s_ease]">
          {isLoading && (
            <div className="flex flex-col gap-[14px]">
              <SkeletonCard variant="release" />
              <SkeletonCard variant="release" />
            </div>
          )}

          {error && (
            <p className="text-error text-[0.9rem]">{error}</p>
          )}

          {!isLoading && !error && releases.length === 0 && (
            <p className="text-hub-text/50 text-[0.9rem]">
              No releases found.
            </p>
          )}

          {!isLoading &&
            !error &&
            releases.map((release, i) => (
              <div
                key={release.tag_name}
                className="p-3 rounded-xl bg-white/[0.04] mb-2.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[0.95rem] font-semibold text-hub-text m-0">
                    {release.name || release.tag_name}
                  </h4>
                  {i === 0 && (
                    <span className="text-[0.7rem] px-2 py-0.5 bg-success/20 text-success rounded-full font-semibold">
                      Latest
                    </span>
                  )}
                </div>

                <time className="text-[0.8rem] text-hub-text/70">
                  {new Date(release.published_at).toLocaleDateString()}
                </time>

                {release.body && (
                  <p className="text-[0.85rem] text-hub-text/60 mt-1.5 line-clamp-3">
                    {release.body.slice(0, 160)}...
                  </p>
                )}

                {/* Assets */}
                {release.assets.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {release.assets.map((asset) => {
                      const platform = detectPlatform(asset.name);
                      return (
                        <a
                          key={asset.name}
                          href={asset.browser_download_url}
                          className="flex items-center gap-2 text-[0.85rem] text-hub-accent no-underline hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i
                            className={`fa-brands ${platform.icon}`}
                          />
                          <span className="truncate">{asset.name}</span>
                          <span className="text-hub-text/40 text-[0.75rem] ml-auto shrink-0">
                            {formatBytes(asset.size)}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}

                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-[0.8rem] text-hub-accent/80 hover:text-hub-accent no-underline"
                >
                  <i className="fa-brands fa-github" /> View on GitHub
                </a>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
