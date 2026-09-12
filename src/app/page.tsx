import { NdaWorkspace } from "@/components/NdaWorkspace";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="relative isolate min-h-[100svh] flex flex-col">
        <div className="hero-atmosphere" aria-hidden />
        <nav className="relative z-10 flex items-center justify-between px-5 sm:px-8 lg:px-12 pt-6">
          <p className="font-display text-2xl sm:text-3xl tracking-tight text-ink">Pre-Legal</p>
          <a
            href="#create"
            className="text-sm font-semibold text-ink-soft hover:text-ink transition"
          >
            Create NDA
          </a>
        </nav>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-5 sm:px-8 lg:px-12 pb-20 pt-16">
          <div className="max-w-3xl">
            <p className="rise font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-ink">
              Pre-Legal
            </p>
            <h1 className="rise-delay mt-6 max-w-xl font-display text-2xl sm:text-3xl text-ink-soft leading-snug">
              Mutual NDAs, filled in minutes—not hours of copy-paste.
            </h1>
            <p className="rise-delay-2 mt-5 max-w-lg text-base sm:text-lg text-ink-soft/90 leading-relaxed">
              Enter the parties and key terms. Preview the completed Common Paper Mutual NDA, then
              download it to your computer.
            </p>
            <div className="rise-delay-2 mt-10 flex flex-wrap gap-3">
              <a
                href="#create"
                className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-paper shadow-lg shadow-accent/25 transition hover:bg-accent-deep"
              >
                Create a Mutual NDA
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-4">
        <NdaWorkspace />
      </main>

      <footer className="border-t border-[var(--line)] px-5 sm:px-8 lg:px-12 py-8 text-sm text-ink-soft">
        <div className="mx-auto max-w-7xl flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg text-ink">Pre-Legal</p>
          <p>
            Mutual NDA based on{" "}
            <a
              className="underline decoration-accent/50 underline-offset-2 hover:text-ink"
              href="https://commonpaper.com/standards/mutual-nda/1.0"
              target="_blank"
              rel="noreferrer"
            >
              Common Paper
            </a>{" "}
            (CC BY 4.0). Not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
