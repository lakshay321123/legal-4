import SearchClient from './search-client';
import type { Metadata } from 'next';

const url = 'https://lexlens.ai/search';

export const metadata: Metadata = {
  title: 'Search Chats – LexLens',
  description: 'Find answers across your previous LexLens conversations.',
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: 'Search Chats – LexLens',
    description: 'Find answers across your previous LexLens conversations.',
    url,
    siteName: 'LexLens',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Search Chats – LexLens',
    description: 'Find answers across your previous LexLens conversations.',
  },
};

export default function Page() {
  return <SearchClient />;
}
