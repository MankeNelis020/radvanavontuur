import type { Metadata } from "next";
import { ExtendedWizard } from "@/components/spin/ExtendedWizard";

export const metadata: Metadata = { title: "Uitgebreid draaien" };

export default function ExtendedPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <h1 className="font-display text-4xl text-forest-950">Uitgebreid draaien</h1>
      <p className="mt-2 text-ink-soft">Vier stappen. Je leeftijden en locatie vraag je maar één keer.</p>
      <div className="mt-6">
        <ExtendedWizard />
      </div>
    </div>
  );
}
