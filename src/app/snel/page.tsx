import type { Metadata } from "next";
import { QuickSpinForm } from "@/components/spin/QuickSpinForm";
import { getDictionary } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.quick.title };
}

export default async function QuickPage() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <h1 className="font-display text-4xl text-forest-950">{t.quick.title}</h1>
      <p className="mt-2 text-ink-soft">{t.quick.intro}</p>
      <div className="mt-6">
        <QuickSpinForm />
      </div>
    </div>
  );
}
