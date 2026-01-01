const list = document.getElementById("app-list");
const API_BASE = location.origin;


function renderHomeSkeleton(count = 3) {
  list.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "app-card";
    sk.innerHTML = `
      <div class="skeleton" style="height:140px;margin-bottom:12px"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-btn"></div>
    `;
    list.appendChild(sk);
  }
}

async function getLatestRelease(repo) {
  try {
    const cacheKey = `release-${repo}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const res = await fetch(
      `${API_BASE}/api/releases/latest/${repo}`
    );


    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (e) {
    console.warn("Release fetch failed:", repo);
    return null;
  }
}

async function loadHome() {
  renderHomeSkeleton(3);

  const res = await fetch(`${API_BASE}/api/public/apps`);
  const data = await res.json();

  list.innerHTML = "";

  const releases = await Promise.all(
    data.apps.map(app => getLatestRelease(app.repo))
  );

  data.apps.forEach((app, i) => {
    const release = releases[i];

    const version = release?.tag_name ?? "N/A";
    const date = release?.published_at
      ? new Date(release.published_at).toLocaleDateString()
      : "";

    const card = document.createElement("div");
    card.className = "app-card";

    card.innerHTML = `
      <img src="${app.thumbnail}" alt="${app.name}">
      <h3>${app.name}</h3>
      <small>${version}${date ? " · " + date : ""} · ${app.developer}</small>
      <p>${app.description}</p>
      <a class="btn" href="app.html?id=${app.id}">
        <i class="fa-solid fa-download"></i> View
      </a>
    `;

    list.appendChild(card);
  });
}

loadHome();
