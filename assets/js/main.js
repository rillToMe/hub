const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const menuOverlay = document.getElementById("menuOverlay");

menuBtn.addEventListener("click", () => {
  mobileMenu.classList.add("active");
  menuOverlay.classList.add("active");
});

menuOverlay.addEventListener("click", closeMenu);

function closeMenu() {
  mobileMenu.classList.remove("active");
  menuOverlay.classList.remove("active");
}

mobileMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", closeMenu);
});

document.getElementById("year").textContent =
  new Date().getFullYear();


const links = document.querySelectorAll(".nav-links a, .mobile-menu a");
const current = location.pathname.split("/").pop();
links.forEach(link => {
  if (link.getAttribute("href").includes(current)) {
    link.classList.add("active");
  }
});