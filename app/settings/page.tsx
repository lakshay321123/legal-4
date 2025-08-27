import SettingsClient from './settings-client';
import type { Metadata } from 'next';

const url = 'https://lexlens.ai/settings';

export const metadata: Metadata = {
  title: 'Settings – LexLens',
  description: 'Manage your LexLens plan and language preferences.',
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: 'Settings – LexLens',
    description: 'Manage your LexLens plan and language preferences.',
    url,
    siteName: 'LexLens',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Settings – LexLens',
    description: 'Manage your LexLens plan and language preferences.',
  },
};

export default function Page() {
  return <SettingsClient />;
}
