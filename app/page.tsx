// app/page.tsx
import { Suspense } from 'react';
import HomeClient from './home-client';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <ErrorBoundary fallback={<div className="p-6 text-sm text-red-600">Recovered from a client error. Please reload if you still see issues.</div>}>
      <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
        <HomeClient />
      </Suspense>
    </ErrorBoundary>
  );
}
