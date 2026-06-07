import { useState, useEffect, useMemo } from "react";
import type { App } from "../types";
import { fetchPublicApps } from "../utils/api";
import RepoCard from "../components/RepoCard";

export default function RepositoryPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicApps()
      .then(setApps)
      .catch((err) => console.error("Failed to load apps:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return apps;
    const q = search.toLowerCase();
    return apps.filter((app) => app.name.toLowerCase().includes(q));
  }, [apps, search]);

  return (
    <>
      <h1 className="text-2xl font-bold text-hub-text mb-4">Repositories</h1>

      <input
        type="text"
        placeholder="Search app..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-[14px] rounded-[14px] my-5 text-base bg-hub-card border border-hub-border text-hub-text placeholder:text-hub-text/40 outline-none focus:border-hub-accent transition-colors"
      />

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-hub-text/50">Loading repositories...</p>
        ) : filtered.length === 0 ? (
          <p className="text-hub-text/50">No repositories found.</p>
        ) : (
          filtered.map((app) => <RepoCard key={app.id} app={app} />)
        )}
      </div>
    </>
  );
}
