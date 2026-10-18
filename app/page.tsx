// Temporary home page. Only logged-in visitors see it (proxy.ts sends everyone
// else to /login). TODO (Phase 3): replace with a redirect to /tickets.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border-4 border-chrome bg-white/70 p-8 text-center shadow-[0_6px_0_var(--color-chrome)] sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange">
          Tomorrow Industries presents
        </p>
        <h1 className="mt-3 font-display text-4xl text-teal sm:text-5xl">
          Ohm Sweet Ohm
          <span className="block text-2xl text-charcoal sm:text-3xl">IT Support</span>
        </h1>
        <p className="mt-6 text-lg">
          You&apos;re all plugged in! The ticket desk is still being wired up. Check back soon.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-bold">
          <span className="rounded-full bg-status-open px-4 py-1 text-white">Open</span>
          <span className="rounded-full bg-status-progress px-4 py-1 text-charcoal">In progress</span>
          <span className="rounded-full bg-status-resolved px-4 py-1 text-white">Resolved</span>
          <span className="rounded-full bg-status-closed px-4 py-1 text-white">Closed</span>
        </div>
      </div>
    </main>
  );
}
