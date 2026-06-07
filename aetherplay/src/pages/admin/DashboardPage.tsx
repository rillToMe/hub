import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { App } from "../../types";
import { AuthStorage } from "../../utils/authStorage";
import { fetchAdminApps, saveAdminApps } from "../../utils/api";
import { resolveAssetPath } from "../../utils/assetPath";

/* ── Empty App template ── */
const EMPTY_APP: App = {
  id: "",
  name: "",
  description: "",
  developer: "",
  repo: "",
  thumbnail: "",
  icon: "",
  platforms: [],
  license: "",
  opensource: true,
};

/* ── Status type ── */
interface Status {
  message: string;
  type: "info" | "success" | "error";
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [apps, setApps] = useState<App[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<App>({ ...EMPTY_APP });
  const [status, setStatus] = useState<Status | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!AuthStorage.isTokenValid()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  /* ── Load apps ── */
  const loadApps = useCallback(async () => {
    setIsDataLoaded(false);
    setStatus({ message: "Loading data...", type: "info" });

    try {
      const data = await fetchAdminApps();
      setApps(data);
      setIsDataLoaded(true);
      setStatus({ message: "Data loaded successfully!", type: "success" });
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus({
        message:
          "Error loading data: " +
          (err instanceof Error ? err.message : "Unknown"),
        type: "error",
      });

      if (err instanceof Error && err.message === "Session expired") {
        navigate("/admin", { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = apps.length;
    const windows = apps.filter((a) =>
      a.platforms.some((p) => p.toLowerCase().includes("windows"))
    ).length;
    const opensource = apps.filter((a) => a.opensource).length;
    return { total, windows, opensource };
  }, [apps]);

  /* ── Form helpers ── */
  function openAddForm() {
    setEditingIndex(null);
    setFormData({ ...EMPTY_APP });
    setFormOpen(true);
  }

  function openEditForm(index: number) {
    setEditingIndex(index);
    setFormData({ ...apps[index] });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingIndex(null);
    setFormData({ ...EMPTY_APP });
  }

  function saveApp() {
    if (!formData.id || !formData.name) {
      setStatus({ message: "ID and Name are required!", type: "error" });
      return;
    }

    const updated = [...apps];
    if (editingIndex !== null) {
      updated[editingIndex] = { ...formData };
    } else {
      updated.push({ ...formData });
    }

    setApps(updated);
    closeForm();
    setStatus({ message: "App saved locally. Click 'Save to File' to persist.", type: "info" });
  }

  function deleteApp(index: number) {
    if (!confirm(`Delete "${apps[index].name}"?`)) return;
    setApps((prev) => prev.filter((_, i) => i !== index));
    setStatus({ message: "App deleted locally. Click 'Save to File' to persist.", type: "info" });
  }

  async function saveToFile() {
    if (!isDataLoaded) {
      setStatus({ message: "Wait! Data is still loading...", type: "error" });
      return;
    }

    setStatus({ message: "Saving to database...", type: "info" });

    try {
      await saveAdminApps(apps);
      setStatus({ message: "Saved successfully!", type: "success" });
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus({
        message:
          "Error saving: " +
          (err instanceof Error ? err.message : "Unknown"),
        type: "error",
      });

      if (err instanceof Error && err.message === "Session expired") {
        navigate("/admin", { replace: true });
      }
    }
  }

  function logout() {
    if (confirm("Log out now?")) {
      AuthStorage.clearToken();
      navigate("/admin", { replace: true });
    }
  }

  /* ── Form field updater ── */
  function updateField(field: keyof App, value: string | boolean | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen bg-admin-bg font-sans text-admin-text">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`fixed inset-0 bg-black/50 z-[999] lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <nav
        className={`w-[280px] bg-admin-sidebar flex flex-col fixed h-screen py-[30px] px-5 border-r border-admin-card z-[1000] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-center mb-[50px]">
          <i className="fa-solid fa-code-branch text-[2.5rem] text-admin-primary mb-[15px] drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
          <span className="block text-[1.2rem] font-bold text-white">
            AetherStudio Hub <small className="text-admin-icon-muted text-[0.8rem]">v1.0</small>
          </span>
        </div>

        <ul className="list-none flex-1 space-y-2">
          {[
            { icon: "fa-house", label: "Dashboard", href: "#", active: true },
            { icon: "fa-globe", label: "View Site", href: "/", target: "_blank" },
            {
              icon: "fa-database",
              label: "Database",
              href: "https://console.neon.tech/",
              target: "_blank",
            },
            {
              icon: "fa-github",
              label: "GitHub",
              href: "https://github.com/rillToMe/hub",
              target: "_blank",
              isBrand: true,
            },
          ].map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.target}
                rel={link.target ? "noopener noreferrer" : undefined}
                className={`flex items-center gap-[15px] px-5 py-3 rounded-xl font-medium no-underline transition-all duration-400 relative overflow-hidden ${
                  link.active
                    ? "bg-admin-primary text-white scale-105 translate-x-2 shadow-[0_10px_20px_rgba(139,92,246,0.4)]"
                    : "text-admin-muted hover:bg-admin-primary/15 hover:text-admin-primary-light hover:scale-105 hover:translate-x-2 hover:shadow-[0_5px_15px_rgba(0,0,0,0.2)]"
                }`}
              >
                <i
                  className={`${link.isBrand ? "fa-brands" : "fa-solid"} ${
                    link.icon
                  }`}
                />
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="border-t border-admin-card pt-4">
          <div className="flex items-center gap-2 text-admin-muted mb-3">
            <i className="fa-solid fa-circle-user text-lg" />
            <span>Admin</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error/10 text-error border-none cursor-pointer font-medium hover:bg-error/20 transition-colors text-sm"
          >
            <i className="fa-solid fa-power-off" /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-0 lg:ml-[280px] p-[30px] w-full lg:w-[calc(100%-280px)] transition-all duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-admin-text text-xl bg-transparent border-none cursor-pointer"
          >
            <i className="fa-solid fa-bars" />
          </button>
          <span className="text-lg font-bold">AetherStudio Admin</span>
        </div>

        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-[30px] flex-wrap gap-[15px]">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-gauge-high text-admin-primary" />
              Admin Panel — Apps Manager
            </h1>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={loadApps}
                className="px-4 py-2 rounded-xl bg-admin-card border border-admin-border text-admin-text cursor-pointer text-sm font-medium hover:border-admin-primary hover:text-admin-primary transition-colors flex items-center gap-2"
              >
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
              <button
                onClick={saveToFile}
                disabled={!isDataLoaded}
                className="px-4 py-2 rounded-xl bg-success/15 border border-success/30 text-success cursor-pointer text-sm font-medium hover:bg-success/25 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-floppy-disk" /> Save to File
              </button>
              <button
                onClick={openAddForm}
                className="px-4 py-2 rounded-xl bg-admin-primary text-white border-none cursor-pointer text-sm font-medium hover:bg-admin-primary-dark transition-colors flex items-center gap-2"
              >
                <i className="fa-solid fa-plus" /> Add New
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-error/15 border border-error/30 text-error cursor-pointer text-sm font-medium hover:bg-error/25 transition-colors flex items-center gap-2 lg:hidden"
              >
                <i className="fa-solid fa-right-from-bracket" /> Logout
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-[30px]">
            {[
              {
                label: "Total Apps",
                value: stats.total,
                icon: "fa-solid fa-layer-group",
                color: "text-admin-primary",
                bg: "bg-admin-primary/10",
              },
              {
                label: "Windows Apps",
                value: stats.windows,
                icon: "fa-brands fa-windows",
                color: "text-info",
                bg: "bg-info/10",
              },
              {
                label: "Open Source",
                value: stats.opensource,
                icon: "fa-solid fa-code",
                color: "text-success",
                bg: "bg-success/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-admin-card p-5 rounded-2xl border border-admin-border flex items-center gap-[15px] transition-all duration-400 hover:-translate-y-1 hover:border-admin-primary/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              >
                <div
                  className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center text-xl`}
                >
                  <i className={stat.icon} />
                </div>
                <div>
                  <span className="block text-admin-muted text-xs uppercase tracking-wide">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`px-5 py-3 rounded-xl mb-5 text-sm font-medium flex items-center gap-2 ${
                status.type === "success"
                  ? "bg-success/10 text-success border border-success/30"
                  : status.type === "error"
                  ? "bg-error/10 text-error border border-error/30"
                  : "bg-info/10 text-info border border-info/30"
              }`}
            >
              <i
                className={`fa-solid ${
                  status.type === "success"
                    ? "fa-circle-check"
                    : status.type === "error"
                    ? "fa-circle-exclamation"
                    : "fa-circle-info"
                }`}
              />
              {status.message}
            </div>
          )}

          {/* Add/Edit Form */}
          {formOpen && (
            <div className="bg-admin-card border border-admin-border rounded-2xl p-6 mb-6 animate-[fade-slide_0.3s_ease]">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <i className="fa-solid fa-folder-plus text-admin-primary" />
                  {editingIndex !== null ? "Edit App" : "Add New App"}
                </h2>
                <button
                  onClick={closeForm}
                  className="w-8 h-8 rounded-lg bg-admin-border/50 border-none text-admin-muted cursor-pointer hover:text-white hover:bg-admin-border transition-colors flex items-center justify-center"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { field: "id" as const, label: "ID", icon: "fa-id-badge", placeholder: "app-id" },
                  { field: "name" as const, label: "Name", icon: "fa-font", placeholder: "App Name" },
                  { field: "developer" as const, label: "Developer", icon: "fa-user-gear", placeholder: "DitDev" },
                  { field: "repo" as const, label: "Repository", icon: "fa-github", placeholder: "username/repo", isBrand: true },
                  { field: "thumbnail" as const, label: "Thumbnail URL", icon: "fa-image", placeholder: "assets/img/..." },
                  { field: "icon" as const, label: "Icon URL", icon: "fa-icons", placeholder: "assets/img/..." },
                  { field: "license" as const, label: "License", icon: "fa-certificate", placeholder: "MIT" },
                ].map((input) => (
                  <div key={input.field}>
                    <label className="block text-admin-muted text-xs mb-1.5 font-medium">
                      <i
                        className={`${input.isBrand ? "fa-brands" : "fa-solid"} ${input.icon} mr-1`}
                      />
                      {input.label}
                    </label>
                    <input
                      type="text"
                      value={formData[input.field] as string}
                      onChange={(e) => updateField(input.field, e.target.value)}
                      placeholder={input.placeholder}
                      className="w-full py-2.5 px-3 bg-admin-bg border border-admin-border rounded-lg text-admin-text text-sm outline-none focus:border-admin-primary transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-admin-muted text-xs mb-1.5 font-medium">
                    <i className="fa-solid fa-laptop-code mr-1" />
                    Platforms
                  </label>
                  <input
                    type="text"
                    value={formData.platforms.join(", ")}
                    onChange={(e) =>
                      updateField(
                        "platforms",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="windows, linux, macos"
                    className="w-full py-2.5 px-3 bg-admin-bg border border-admin-border rounded-lg text-admin-text text-sm outline-none focus:border-admin-primary transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-admin-muted text-xs mb-1.5 font-medium">
                    <i className="fa-solid fa-align-left mr-1" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="App description..."
                    rows={3}
                    className="w-full py-2.5 px-3 bg-admin-bg border border-admin-border rounded-lg text-admin-text text-sm outline-none focus:border-admin-primary transition-colors resize-y"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="opensource"
                    checked={formData.opensource}
                    onChange={(e) => updateField("opensource", e.target.checked)}
                    className="w-4 h-4 accent-admin-primary"
                  />
                  <label
                    htmlFor="opensource"
                    className="text-admin-muted text-sm cursor-pointer"
                  >
                    <i className="fa-solid fa-code mr-1" /> Open Source
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={saveApp}
                  className="px-5 py-2.5 rounded-xl bg-admin-primary text-white border-none cursor-pointer font-medium text-sm hover:bg-admin-primary-dark transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-check" /> Save App
                </button>
                <button
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl bg-admin-border/50 text-admin-muted border-none cursor-pointer font-medium text-sm hover:text-white hover:bg-admin-border transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-ban" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Apps List */}
          <div className="flex flex-col gap-3">
            {apps.map((app, index) => (
              <div
                key={app.id || index}
                className="bg-admin-card border border-admin-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:border-admin-primary/30 hover:shadow-[0_5px_20px_rgba(0,0,0,0.2)]"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {app.icon && (
                    <img
                      src={resolveAssetPath(app.icon)}
                      alt={app.name}
                      className="w-12 h-12 rounded-xl object-cover border border-admin-border shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      {app.name}
                    </div>
                    <div className="text-admin-muted text-xs flex items-center gap-3 mt-0.5">
                      <span>
                        <i className="fa-brands fa-github mr-1" />
                        {app.repo}
                      </span>
                      <span>
                        {app.opensource ? (
                          <span className="text-success">
                            <i className="fa-solid fa-code mr-1" />
                            Open Source
                          </span>
                        ) : (
                          "Closed"
                        )}
                      </span>
                    </div>
                    <div className="text-admin-muted/60 text-xs mt-1 truncate">
                      {app.description}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEditForm(index)}
                    className="px-3 py-2 rounded-lg bg-info/10 text-info border-none cursor-pointer text-xs font-medium hover:bg-info/20 transition-colors flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-pen" /> Edit
                  </button>
                  <button
                    onClick={() => deleteApp(index)}
                    className="px-3 py-2 rounded-lg bg-error/10 text-error border-none cursor-pointer text-xs font-medium hover:bg-error/20 transition-colors flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-trash" /> Delete
                  </button>
                </div>
              </div>
            ))}

            {apps.length === 0 && isDataLoaded && (
              <div className="text-center py-12 text-admin-muted">
                <i className="fa-solid fa-box-open text-4xl mb-4 block opacity-40" />
                <p>No apps yet. Click "Add New" to get started.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center py-6 mt-8 text-admin-muted text-xs border-t border-admin-border">
            &copy; {year} <strong className="text-white">AetherStudio</strong> •{" "}
            <i className="fa-solid fa-shield-halved" /> Secure Admin Environment
          </div>
        </div>
      </main>
    </div>
  );
}
