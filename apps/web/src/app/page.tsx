import Link from "next/link";

export default function Home() {
  return (
    <section className="flex flex-col gap-6 py-12">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">
        A world that never sleeps
      </p>
      <h1 className="text-4xl font-semibold text-gold sm:text-5xl">
        Build something that remains after you leave.
      </h1>
      <p className="max-w-2xl text-muted">
        Found a settlement, gather resources, and raise buildings in a shared
        persistent world. Production and construction continue while you are
        away.
      </p>
      <div>
        <Link
          href="/settlement"
          className="inline-block rounded bg-accent px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          Enter the world
        </Link>
      </div>
    </section>
  );
}
