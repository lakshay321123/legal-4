// app/page.tsx
import { Suspense } from 'react';
import HomeClient from './home-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <HomeClient />
    </Suspense>
  );
}
