import { Link } from "react-router-dom";
import type { App, Release } from "../types";
import { resolveAssetPath } from "../utils/assetPath";

interface AppCardProps {
  app: App;
  release: Release | null;
}

export default function AppCard({ app, release }: AppCardProps) {
  const version = release?.tag_name ?? "N/A";
  const date = release?.published_at
    ? new Date(release.published_at).toLocaleDateString()
    : "";

  return (
    <div className="bg-hub-card border border-hub-border p-4 rounded-[10px] transition-all duration-200 hover:-translate-y-1 hover:border-hub-accent group">
      {app.thumbnail && (
        <img
          src={resolveAssetPath(app.thumbnail)}
          alt={app.name}
          className="w-full rounded-[14px] mb-3"
          loading="lazy"
        />
      )}

      <h3 className="text-hub-text font-semibold text-[1.05rem] mb-1">
        {app.name}
      </h3>

      <p className="text-hub-text/70 text-[0.85rem] mb-2 line-clamp-2">
        {app.description}
      </p>

      <div className="flex items-center gap-2 text-[0.8rem] text-hub-text/50 mb-3">
        {version !== "N/A" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-hub-border/50 rounded text-hub-accent text-[0.8rem]">
            <i className="fa-solid fa-tag" />
            {version}
          </span>
        )}
        {date && <span>{date}</span>}
      </div>

      <Link
        to={`/app?id=${app.id}`}
        className="inline-flex items-center gap-2 mt-1 px-5 py-3 min-h-[44px] bg-gradient-to-br from-hub-accent to-hub-accent-light text-hub-bg no-underline rounded-[14px] font-semibold text-[0.95rem] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(88,166,255,0.3)] active:scale-95"
      >
        <i className="fa-solid fa-arrow-right" />
        View App
      </Link>
    </div>
  );
}
