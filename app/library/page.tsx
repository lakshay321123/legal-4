import LibraryClient from './library-client';
import type { Metadata } from 'next';

const url = 'https://lexlens.ai/library';

export const metadata: Metadata = {
  title: 'Library – LexLens',
  description: 'Browse your saved legal answers and source citations.',
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: 'Library – LexLens',
    description: 'Browse your saved legal answers and source citations.',
    url,
    siteName: 'LexLens',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Library – LexLens',
    description: 'Browse your saved legal answers and source citations.',
  },
};

export default function Page() {
  return <LibraryClient />;
}
