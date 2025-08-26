import './globals.css';
import TopBar from '@/components/TopBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LexLens — Legal Search AI',
  description: 'All things legal without being your legal lawyer—citations first.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopBar/>
        <main className="mx-auto max-w-[1400px] px-4 mt-5 flex gap-4">
          {children}
        </main>
        <footer className="mt-10 border-t border-zinc-200 py-6 text-xs text-zinc-500">
          <div className="mx-auto max-w-[1400px] px-4">
            <div>© {new Date().getFullYear()} LexLens. Informational only; not legal advice. <a href="/legal/disclaimer" className="underline">Disclaimer</a> · <a href="/legal/terms" className="underline">Terms</a> · <a href="/legal/privacy" className="underline">Privacy</a> · <a href="/legal/sourcing" className="underline">Sourcing</a></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
