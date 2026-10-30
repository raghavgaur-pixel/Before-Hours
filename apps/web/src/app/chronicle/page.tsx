import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chronicle" };

export default function ChroniclePage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-gold">Chronicle</h1>
      <p className="mt-2 text-muted">Coming soon.</p>
    </section>
  );
}
