const appId = new URLSearchParams(location.search).get("id");
const API_BASE = location.origin;

const dl = document.getElementById("download-buttons");

const CACHE_TTL = 10 * 60 * 1000; 

const PLATFORM_META = {
  windows: { label: "Windows", icon: "fa-windows" },
  macos: { label: "macOS", icon: "fa-apple" },
  linux: { label: "Linux", icon: "fa-linux" },
  android: { label: "Android", icon: "fa-android" },
  ios: { label: "iOS", icon: "fa-apple" },
  web: { label: "Web", icon: "fa-globe" }
};


async function getLatestRelease(repo) {
  const cacheKey = `gh_latest_${repo}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.time < CACHE_TTL) {
      return data.release;
    }
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/releases/latest/${repo}`
    );


    if (!res.ok) {
      return null;
    }

    const release = await res.json(); 

    localStorage.setItem(
      cacheKey,
      JSON.stringify({ time: Date.now(), release })
    );

    return release;

  } catch (err) {
    console.error(err);
    return null;
  }
}

function formatSize(bytes) {
  if (!bytes) return "";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}


function detectType(name) {
  name = name.toLowerCase();

  if (name.includes("portable"))
    return { label: "Portable", icon: "fa-box-archive" };

  if (name.includes("setup") || name.includes("installer"))
    return { label: "Installer", icon: "fa-gears", recommended: true };

  if (name.endsWith(".apk"))
    return { label: "APK", icon: "fa-android" };

  if (name.endsWith(".ipa"))
    return { label: "IPA", icon: "fa-apple" };

  return { label: "Download", icon: "fa-download" };
}


function detectPlatform(name) {
  name = name.toLowerCase();

  if (name.match(/\.apk|android/))
    return { key: "android", label: "Android", icon: "fa-android" };

  if (name.match(/\.ipa|ios/))
    return { key: "ios", label: "iOS", icon: "fa-apple" };

  if (name.includes("portable"))
    return { key: "windows", label: "Windows", icon: "fa-windows" };

  if (name.match(/\.exe|\.msi|windows|win/))
    return { key: "windows", label: "Windows", icon: "fa-windows" };

  if (name.match(/\.appimage|\.deb|\.rpm|linux/))
    return { key: "linux", label: "Linux", icon: "fa-linux" };

  if (name.match(/\.dmg|\.pkg|mac|osx/))
    return { key: "mac", label: "macOS", icon: "fa-apple" };

  if (name.match(/\.html|\.wasm|web/))
    return { key: "web", label: "Web", icon: "fa-globe" };

  return { key: "other", label: "Other", icon: "fa-download" };
}


function getPlatformSuffix(items) {
  let hasInstaller = false;
  let hasPortable = false;
  let types = new Set();

  items.forEach(asset => {
    const type = detectType(asset.name);
    if (type.label === "Installer") hasInstaller = true;
    if (type.label === "Portable") hasPortable = true;
    types.add(detectType(asset.name).label);
  });

  if (types.has("Installer") && types.has("Portable"))
    return " (Installer & Portable)";

  return "";
}

function getUserOS() {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "mac";
  if (ua.includes("linux")) return "linux";

  return null;
}

function renderAppPlatforms(platforms = []) {
  const el = document.getElementById("app-platform");

  if (!platforms.length) {
    el.innerHTML = "<strong>Platform:</strong> Unknown";
    return;
  }

  const html = platforms
    .map(p => {
      const meta = PLATFORM_META[p];
      if (!meta) return p;
      return `<i class="fa-brands ${meta.icon}"></i> ${meta.label}`;
    })
    .join(", ");

  el.innerHTML = `<strong>Platform:</strong> ${html}`;
}


function renderAppLicense(license) {
  const el = document.getElementById("app-license");

  if (!license) {
    el.innerHTML = "<strong>License:</strong> -";
    return;
  }

  el.innerHTML = `
    <strong>License:</strong>
    ${license.name}
    ${license.opensource ? `<span class="badge">Open Source</span>` : ""}
  `;
}


function renderDownloadSkeleton() {
  dl.innerHTML = `
    <div class="skeleton skeleton-title"></div>
    <div class="skeleton skeleton-btn"></div>
    <div class="skeleton skeleton-btn"></div>
  `;
}

renderDownloadSkeleton();

(async function () {
  try {
    const res = await fetch(`${API_BASE}/api/public/apps`);
    const data = await res.json();

    const app = data.apps.find(a => a.id === appId);
    if (!app) {
      dl.innerHTML = `<p style="color:#f85149">App not found.</p>`;
      return;
    }

    renderAppPlatforms(app.platforms);
    renderAppLicense(app.license);

    document.getElementById("app-about").innerText =
    app.about || app.description || "";

    document.getElementById("app-release").href =
      `https://github.com/${app.repo}/releases`;



    document.getElementById("app-name").innerText = app.name;
    document.getElementById("app-desc").innerText = app.description;
    document.getElementById("app-icon").src = app.icon;
    document.getElementById("repo").href = `https://github.com/${app.repo}`;

    const release = await getLatestRelease(app.repo);
    document.getElementById("releases").href = release.html_url;

    if (!release.assets || release.assets.length === 0) {
      dl.innerHTML = `<p>No downloadable assets.</p>`;
      return;
    }

    dl.innerHTML = "";

    const grouped = {};

    release.assets.forEach(asset => {
      const platform = detectPlatform(asset.name);
      if (!grouped[platform.key]) {
        grouped[platform.key] = { ...platform, items: [] };
      }
      grouped[platform.key].items.push(asset);
    });

    const userOS = getUserOS();

    Object.values(grouped).forEach(group => {
        const section = document.createElement("div");
        section.className = "platform-block";

        if (group.key === userOS) {
            section.classList.add("highlight");
        }

        const suffix = getPlatformSuffix(group.items);

        section.innerHTML = `
            <h3 class="platform-title">
            <i class="fa-brands ${group.icon}"></i>
            ${group.label}${suffix}
            ${group.key === userOS ? `<span class="badge">Your OS</span>` : ""}
            </h3>
        `;


      group.items.forEach(asset => {
        const type = detectType(asset.name);

        const btn = document.createElement("a");
        btn.className = "btn";
        btn.href = asset.browser_download_url;
        btn.target = "_blank";

        btn.innerHTML = `
          <i class="fa-solid ${type.icon}"></i>
          ${type.label}
          ${type.recommended ? `<span class="badge">Recommended</span>` : ""}
          <span class="file-size">${formatSize(asset.size)}</span>
        `;

        section.appendChild(btn);
      });

      dl.appendChild(section);
    });

  } catch (err) {
    console.error(err);
    dl.innerHTML = `
      <p style="color:#f85149">
        Failed to load data.<br>
        <small>${err.message}</small>
      </p>
    `;
  }
})();
