import type { Metadata } from 'next';

const url = 'https://lexlens.ai/legal/terms';

export const metadata: Metadata = {
  title: 'Terms of Service – LexLens',
  description: 'Rules and conditions for using the LexLens service.',
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: 'Terms of Service – LexLens',
    description: 'Rules and conditions for using the LexLens service.',
    url,
    siteName: 'LexLens',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service – LexLens',
    description: 'Rules and conditions for using the LexLens service.',
  },
};

export default function TermsPage() {
  return (
    <div className="prose max-w-3xl">
      <h1>Terms of Service</h1>
      <p>These Terms govern your use of the site and services provided by LexLens. By using our Services you agree to these Terms. This service provides general legal information and links to official sources. It does not provide legal advice or create an attorney–client relationship.</p>
      <p>Use is subject to fair use and rate limits. Do not upload case files or personal data. For full, customizable Terms, see the canvas doc in your project or contact legal@yourdomain.</p>
    </div>
  );
}
