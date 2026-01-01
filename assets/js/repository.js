const repoList = document.getElementById("repo-list");
const searchInput = document.getElementById("search");
const API_BASE = location.origin;


const CACHE_TTL = 10 * 60 * 1000; 
let apps = [];

fetch("../data/apps.json")
  .then(r => r.json())
  .then(data => {
    apps = data.apps;
    renderApps(apps);
  });

function renderApps(list) {
  repoList.innerHTML = "";

  list.forEach(app => {
    const card = document.createElement("div");
    card.className = "repo-card";

    card.innerHTML = `
      <div class="repo-header">
        <div class="repo-title">${app.name}</div>
        <div class="repo-toggle">
          <i class="fa-solid fa-chevron-down"></i>
        </div>
      </div>
      <div class="release-panel"></div>
    `;

    const header = card.querySelector(".repo-header");
    const panel = card.querySelector(".release-panel");

    let loaded = false;

    header.addEventListener("click", () => {
  card.classList.toggle("open");

  if (!loaded) {
    loaded = true;
    renderReleaseSkeleton(panel, 2);
    loadReleases(app.repo, panel);
  }
});


    repoList.appendChild(card);
  });
}

async function loadReleases(repoFull, container) {
  const cacheKey = `gh_releases_${repoFull}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.time < CACHE_TTL && Array.isArray(data.releases)) {
      renderReleases(data.releases, container);
      return;
    }
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/releases/${repoFull}`
    );


    if (!res.ok) {
      container.innerHTML = `<p>Failed to load releases (${res.status})</p>`;
      return;
    }

    const releases = await res.json(); 

    localStorage.setItem(
      cacheKey,
      JSON.stringify({ time: Date.now(), releases })
    );

    renderReleases(releases, container);

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading releases.</p>";
  }
}

function renderReleaseSkeleton(container, count = 2) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "release-skeleton";

  for (let i = 0; i < count; i++) {
    const skel = document.createElement("div");
    skel.className = "skeleton-release";

    skel.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-date"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
    `;

    wrap.appendChild(skel);
  }

  container.appendChild(wrap);
}

function renderReleases(releases, container) {
  if (!releases || releases.length === 0) {
    container.innerHTML = "<p>No releases available.</p>";
    return;
  }

  container.innerHTML = "";

  releases.forEach((r, index) => {
    const isLatest = index === 0;

    const release = document.createElement("div");
    release.className = "release-card";

    release.innerHTML = `
      <div class="release-header">
        <h4>${r.name || r.tag_name}</h4>
        ${isLatest ? `<span class="badge latest">Latest</span>` : ""}
      </div>

      <time>${new Date(r.published_at).toLocaleDateString()}</time>

      ${r.body ? `<p>${r.body.slice(0, 160)}...</p>` : ""}

      <div class="asset-list">
        ${renderAssets(r.assets)}
      </div>

      <a class="release-link" href="${r.html_url}" target="_blank">
        View on GitHub
      </a>
    `;

    container.appendChild(release);
  });
}

function renderAssets(assets) {
  if (!assets || assets.length === 0) {
    return `<p class="muted">No downloadable assets.</p>`;
  }

  return assets.map(a => {
    const type = detectAssetType(a.name);

    return `
      <a class="asset-btn" href="${a.browser_download_url}" target="_blank">
        <i class="fa-solid ${type.icon}"></i>
        ${type.label}
        <span class="size">${formatSize(a.size)}</span>
      </a>
    `;
  }).join("");
}

function detectAssetType(name) {
  name = name.toLowerCase();

  if (name.includes("portable"))
    return { label: "Portable", icon: "fa-box-archive" };

  if (name.includes("setup") || name.includes("installer"))
    return { label: "Installer", icon: "fa-gears" };

  if (name.endsWith(".apk"))
    return { label: "APK", icon: "fa-android" };

  if (name.endsWith(".zip"))
    return { label: "ZIP", icon: "fa-file-zipper" };

  return { label: "Download", icon: "fa-download" };
}

function formatSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  renderApps(apps.filter(a => a.name.toLowerCase().includes(q)));
});
