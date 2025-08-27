import HomeClient from './home-client';
import type { Metadata } from 'next';

const baseUrl = 'https://lexlens.ai';

export const metadata: Metadata = {
  title: 'LexLens — Legal Search AI',
  description: 'Chat-style legal answers with citations from official sources.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'LexLens — Legal Search AI',
    description: 'Chat-style legal answers with citations from official sources.',
    url: baseUrl,
    siteName: 'LexLens',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'LexLens — Legal Search AI',
    description: 'Chat-style legal answers with citations from official sources.',
  },
};

export default function Page() {
  return <HomeClient />;
}
