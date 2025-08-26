import Link from 'next/link';

export default function UpgradePage() {
  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-2xl font-semibold mb-2">Upgrade</h1>
      <p className="text-sm text-zinc-600 mb-6">Unlock unlimited Lawyer mode, exports, and advanced filters.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Citizen (Free)</div>
          <ul className="mt-3 text-sm space-y-2 text-zinc-700">
            <li>Plain-language answers</li>
            <li>Official source links</li>
            <li>Save to Library</li>
          </ul>
          <div className="mt-4 text-xs text-zinc-500">No card needed</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Lawyer Pro</div>
          <ul className="mt-3 text-sm space-y-2 text-zinc-700">
            <li>Unlimited Lawyer mode</li>
            <li>Filters & paragraph quotes</li>
            <li>Docx export (coming soon)</li>
          </ul>
          <Link href="#" className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 text-white px-3 py-2 text-sm pointer-events-none opacity-60">Checkout (stub)</Link>
          <div className="mt-2 text-xs text-zinc-500">Stripe integration to be added</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Firm</div>
          <ul className="mt-3 text-sm space-y-2 text-zinc-700">
            <li>5 seats included</li>
            <li>SSO & shared Library</li>
            <li>Priority support</li>
          </ul>
          <Link href="#" className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 text-white px-3 py-2 text-sm pointer-events-none opacity-60">Contact sales (stub)</Link>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mt-6">This is a placeholder page. Billing will be wired with Stripe (test mode) when you’re ready.</p>
    </div>
  )
}
