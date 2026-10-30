import type { Metadata } from "next";
import { WorldView } from "@/components/world/WorldView";

export const metadata: Metadata = { title: "World" };

export default function WorldPage() {
  return <WorldView />;
}
