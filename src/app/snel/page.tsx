import type { Metadata } from "next";
import { QuickSpinForm } from "@/components/spin/QuickSpinForm";

export const metadata: Metadata = { title: "Snel draaien" };

export default function QuickPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <h1 className="font-display text-4xl text-forest-950">Snel draaien</h1>
      <p className="mt-2 text-ink-soft">Een halve minuut. Leeftijden, een straal, en het rad.</p>
      <div className="mt-6">
        <QuickSpinForm />
      </div>
    </div>
  );
}
