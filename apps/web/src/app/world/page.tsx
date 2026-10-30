import type { Metadata } from "next";

export const metadata: Metadata = { title: "World" };

export default function WorldPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-gold">World</h1>
      <p className="mt-2 text-muted">Coming soon.</p>
    </section>
  );
}
