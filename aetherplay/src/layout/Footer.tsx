import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-hub-border bg-gradient-to-b from-hub-card/90 to-hub-bg">
      <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="text-[1.35rem] font-bold text-hub-text mb-2">
            AetherStudio<span className="text-hub-accent">.</span>
          </div>
          <p className="text-[0.9rem] text-hub-text opacity-70 leading-relaxed">
            Personal developer hub for tools, experiments,
            <br />
            and open-source projects.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <h4 className="text-hub-text font-semibold mb-1">Links</h4>
          <Link
            to="/"
            className="text-hub-text/70 hover:text-hub-accent no-underline text-[0.9rem] transition-colors"
          >
            Home
          </Link>
          <Link
            to="/repository"
            className="text-hub-text/70 hover:text-hub-accent no-underline text-[0.9rem] transition-colors"
          >
            Repositories
          </Link>
          <Link
            to="/about"
            className="text-hub-text/70 hover:text-hub-accent no-underline text-[0.9rem] transition-colors"
          >
            About
          </Link>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-hub-text font-semibold mb-3">Connect</h4>
          <div className="flex gap-4">
            <a
              href="https://github.com/rillToMe"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-hub-text/60 hover:text-hub-accent text-xl transition-colors"
            >
              <i className="fa-brands fa-github" />
            </a>
            <a
              href="https://instagram.com/rill_lyrics"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-hub-text/60 hover:text-hub-accent text-xl transition-colors"
            >
              <i className="fa-brands fa-instagram" />
            </a>
            <a
              href="https://ditdev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Portfolio"
              className="text-hub-text/60 hover:text-hub-accent text-xl transition-colors"
            >
              <i className="fa-solid fa-globe" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-hub-border text-center py-5 text-[0.85rem] text-hub-text/50">
        &copy; {year} <strong>AetherStudio</strong> • Built with ❤️ and
        caffeine
      </div>
    </footer>
  );
}
