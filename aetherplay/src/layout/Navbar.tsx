import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavbarProps {
  brandName?: string;
}

const NAV_LINKS = [
  { to: "/", label: "Home", icon: "fa-solid fa-house" },
  { to: "/repository", label: "Repository", icon: "fa-brands fa-github" },
  { to: "/about", label: "About", icon: "fa-solid fa-circle-info" },
];

export default function Navbar({ brandName = "AetherStudio" }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <nav className="flex items-center justify-between px-8 py-[18px] border-b border-hub-border font-mono">
        <Link
          to="/"
          className="text-[1.35rem] font-bold tracking-wide text-hub-text no-underline leading-none hover:text-hub-accent transition-colors"
        >
          {brandName}
        </Link>

        {/* Desktop Links */}
        <div className="hidden sm:flex gap-[18px]">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-[0.95rem] no-underline transition-colors ${
                location.pathname === link.to
                  ? "text-hub-accent"
                  : "text-hub-text hover:text-hub-accent"
              }`}
            >
              <i className={`${link.icon} mr-1.5`} />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden text-hub-text text-xl bg-transparent border-none cursor-pointer"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <i className="fa-solid fa-bars" />
        </button>
      </nav>

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[280px] bg-hub-card z-[1001] flex flex-col p-6 transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-[18px] pb-[14px] border-b border-hub-border">
          <div className="text-[1.4rem] font-bold tracking-wide text-hub-text">
            {brandName}
          </div>
          <small className="opacity-60 text-[0.85rem] text-hub-text">
            Developer Hub
          </small>
        </div>

        <div className="flex flex-col gap-1.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={`flex items-center gap-2.5 px-[14px] py-3 rounded-[10px] text-[1.05rem] no-underline transition-all duration-150 ${
                location.pathname === link.to
                  ? "bg-hub-accent/15 text-hub-accent"
                  : "text-hub-text hover:bg-hub-accent/[0.08] hover:translate-x-0.5"
              }`}
            >
              <i className={link.icon} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-[14px] border-t border-hub-border text-[0.85rem] opacity-70 flex items-center gap-2 text-hub-text">
          <span className="w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-[pulse-glow_2s_ease-in-out_infinite]" />
          API Online
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/55 z-[1000] transition-opacity duration-250 ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
      />
    </>
  );
}
