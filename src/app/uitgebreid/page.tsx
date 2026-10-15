import type { Metadata } from "next";
import { ExtendedWizard } from "@/components/spin/ExtendedWizard";
import { getDictionary } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.extended.title };
}

export default async function ExtendedPage() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <h1 className="font-display text-4xl text-forest-950">{t.extended.title}</h1>
      <p className="mt-2 text-ink-soft">{t.extended.intro}</p>
      <div className="mt-6">
        <ExtendedWizard />
      </div>
    </div>
  );
}
