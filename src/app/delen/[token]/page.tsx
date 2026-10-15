import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedSession } from "@/application/adventures";
import { toAdventureView } from "@/application/view";
import { AdventureExperience } from "@/components/result/AdventureExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Gedeeld avontuur" };

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getSharedSession(token);
  if (!session) notFound();
  const view = await toAdventureView(session, true);
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <p className="mb-4 text-sm text-ink-soft">
        Gedeeld avontuur. Het startpunt van de afzender staat hier niet in. Deel je eigen locatie als je vanaf daar wilt navigeren.
      </p>
      <AdventureExperience view={view} signedIn={false} />
    </div>
  );
}
