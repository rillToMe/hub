export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-hub-card border border-hub-border rounded-[20px] p-8">
        <h1 className="text-center text-2xl font-bold text-hub-text mb-4">
          About AetherStudio
        </h1>

        <p className="text-center text-[1.05rem] text-hub-text/90 mb-7 px-4">
          AetherStudio is a personal developer hub created to distribute,
          document, and maintain desktop and mobile applications with
          performance, simplicity, and usability in mind.
        </p>

        {/* What is */}
        <section className="mb-[26px]">
          <h2 className="text-[1.25rem] font-semibold text-hub-accent mb-2.5">
            What is AetherStudio?
          </h2>
          <p className="leading-[1.7] text-hub-text/85">
            AetherStudio serves as a centralized platform where all
            applications, utilities, and experimental projects are published and
            maintained. Automated GitHub release sync ensures users get the
            latest version without manual updates.
          </p>
        </section>

        {/* Main Focus */}
        <section className="mb-[26px]">
          <h2 className="text-[1.25rem] font-semibold text-hub-accent mb-2.5">
            Main Focus
          </h2>
          <ul className="pl-[18px] text-hub-text/85 space-y-2">
            <li>Desktop Applications (Windows, Linux, macOS)</li>
            <li>Portable &amp; Installer-based tools</li>
            <li>Mobile Applications (Android &amp; iOS)</li>
            <li>Open-source &amp; GitHub-first workflow</li>
          </ul>
        </section>

        {/* Tech Stack */}
        <section className="mb-[26px]">
          <h2 className="text-[1.25rem] font-semibold text-hub-accent mb-2.5">
            Technology Stack
          </h2>
          <ul className="pl-[18px] text-hub-text/85 space-y-2">
            <li>.NET (WPF, WinForms, ASP.NET)</li>
            <li>JavaScript, HTML, CSS</li>
            <li>GitHub API for automatic release sync</li>
            <li>Modern UI/UX with dark mode-first design</li>
          </ul>
        </section>

        {/* Why */}
        <section className="mb-[26px]">
          <h2 className="text-[1.25rem] font-semibold text-hub-accent mb-2.5">
            Why AetherStudio?
          </h2>
          <p className="leading-[1.7] text-hub-text/85">
            The goal of AetherStudio is to eliminate friction between
            development and distribution. Every application listed here is
            automatically synced with GitHub releases, ensuring users always get
            the latest version seamlessly.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-[26px]">
          <h2 className="text-[1.25rem] font-semibold text-hub-accent mb-2.5">
            Contact &amp; Links
          </h2>
          <ul className="pl-[18px] text-hub-text/85 space-y-2">
            <li>
              <i className="fa-brands fa-github mr-2" />
              <a
                href="https://github.com/rillToMe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hub-accent hover:underline"
              >
                github.com/rillToMe
              </a>
            </li>
            <li>
              <i className="fa-brands fa-instagram mr-2" />
              <a
                href="https://instagram.com/rill_lyrics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hub-accent hover:underline"
              >
                @rill_lyrics
              </a>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="border-t border-hub-border pt-[18px] mt-7 text-center text-[0.95rem] text-hub-text/75">
          <p>Made with passion for open-source development.</p>
        </div>
      </div>
    </div>
  );
}
