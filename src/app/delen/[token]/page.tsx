import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedSession } from "@/application/adventures";
import { toAdventureView } from "@/application/view";
import { AdventureExperience } from "@/components/result/AdventureExperience";
import { getDictionary } from "@/i18n/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.result.sharedTitle };
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t } = await getDictionary();
  const session = await getSharedSession(token);
  if (!session) notFound();
  const view = await toAdventureView(session, true);
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <p className="mb-4 text-sm text-ink-soft">{t.result.sharedIntro}</p>
      <AdventureExperience view={view} signedIn={false} />
    </div>
  );
}
