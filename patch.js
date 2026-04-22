const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf-8');

const newContent = `export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#0c1317] text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900">
            <Image
              src="/platanist_clinic_desk_minimal.png"
              alt="Logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
          </div>
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">
            Clinic Desk <span className="text-brand-600 dark:text-brand-400 font-medium">by Platanist</span>
          </span>
        </div>
        <a
          href="https://github.com/abdullahanzar/clinic-desk-platanist"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors"
        >
          <Github className="h-5 w-5" />
          <span className="hidden sm:inline">Star on GitHub</span>
        </a>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center mx-auto max-w-5xl w-full">
        <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[80px] bg-brand-300 dark:bg-brand-900/40 rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/80 px-4 py-1.5 text-sm font-semibold text-brand-700 dark:border-brand-800/80 dark:bg-[#112a28] dark:text-brand-300 mb-8 backdrop-blur-md shadow-sm">
          <Shield className="h-4 w-4" />
          Open-Source & AGPL-3.0 Licensed
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 text-balance leading-tight">
          Modern clinic management, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">deployed your way.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl text-balance leading-relaxed mx-auto">
          A focused OPD workflow for patient visits, smart prescriptions, and unified billing.
          Experience it instantly in your browser, or download the desktop application for native performance.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(13,148,136,0.25)] transition-all hover:bg-brand-700 hover:shadow-[0_10px_35px_rgba(13,148,136,0.35)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <Globe className="h-5 w-5" />
            Launch Web App
          </Link>
          <a
            href="#downloads"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-700 hover:-translate-y-0.5 active:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-600 dark:hover:text-brand-300"
          >
            <Download className="h-5 w-5" />
            Desktop Downloads
          </a>
        </div>
      </section>

      {/* Downloads Grid */}
      <section id="downloads" className="relative z-10 py-24 bg-white dark:bg-[#0f172a] border-t border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Native Desktop Apps</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get the standalone clinic experience. Packaged desktop apps connect to your existing database and run with zero browser chrome.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {desktopDownloads.map((download) => (
              <a
                key={\`\${download.platform}-\${download.format}\`}
                href={buildDownloadUrl(download.filename)}
                className="group flex flex-col items-center text-center p-8 rounded-[2.5rem] border border-slate-200/70 bg-slate-50/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 hover:border-brand-300 hover:-translate-y-1.5 dark:border-slate-800 dark:bg-[#121c26] dark:hover:border-brand-700"
              >
                <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-white border border-slate-200/80 text-brand-600 shadow-sm mb-6 group-hover:scale-110 group-hover:text-brand-700 transition-transform duration-300 dark:bg-slate-800 dark:border-slate-700 dark:text-brand-400 dark:group-hover:text-brand-300">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{download.platform}</h3>
                <span className="inline-block px-3 py-1 bg-slate-200/60 text-slate-700 rounded-full text-xs font-semibold mb-4 dark:bg-slate-800/80 dark:text-slate-300">{download.format}</span>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 flex-grow leading-relaxed">{download.description}</p>
                <div className="text-brand-600 dark:text-brand-400 font-semibold text-sm inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                  Download v{APP_VERSION} <ArrowRight className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Source & Docs Section */}
      <section className="relative z-10 py-24 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0c1317]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Built for Transparency</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Clinic Desk is fully accessible. Audit the code, build from source, or customize for your specific clinic requirements.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {sourceLinks.map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col p-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-400 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 mb-6 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                  {item.title === "Open-source license" ? (
                    <Scale className="h-6 w-6" />
                  ) : item.title === "Electron desktop branch" ? (
                    <Code2 className="h-6 w-6" />
                  ) : (
                    <Github className="h-6 w-6" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-grow">
                  {item.description}
                </p>
                <div className="text-slate-700 dark:text-slate-300 font-semibold text-sm inline-flex items-center gap-1.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {item.label} <ExternalLink className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1317]">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Clinic Desk by Platanist</p>
          <div className="flex items-center gap-4">
            <Link href="/legal/license" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">License</Link>
            <span className="opacity-50">•</span>
            <Link href="/legal/disclaimer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}`;

const finalComponent = content.replace(/export default async function Home\(\) {[\s\S]*/m, newContent);
fs.writeFileSync('app/page.tsx', finalComponent, 'utf-8');
