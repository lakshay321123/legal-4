import type { Metadata } from 'next';

const url = 'https://lexlens.ai/legal/sourcing';

export const metadata: Metadata = {
  title: 'Attribution & Sourcing – LexLens',
  description: 'Learn about the official sources behind LexLens answers and citations.',
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: 'Attribution & Sourcing – LexLens',
    description: 'Learn about the official sources behind LexLens answers and citations.',
    url,
    siteName: 'LexLens',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Attribution & Sourcing – LexLens',
    description: 'Learn about the official sources behind LexLens answers and citations.',
  },
};

export default function SourcingPage() {
  return (
    <div className="prose max-w-3xl">
      <h1>Attribution &amp; Sourcing</h1>
      <p>We prioritize official sources such as India Code, the Gazette of India, and Supreme/High Court websites. We do not ingest proprietary headnotes or commercial digests. Every answer includes citations and direct links to primary materials.</p>
    </div>
  );
}
