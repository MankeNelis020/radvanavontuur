import { notFound } from "next/navigation";
import { getOwnedSession } from "@/application/adventures";
import { toAdventureView } from "@/application/view";
import { currentUserId } from "@/auth/server";
import { AdventureExperience } from "@/components/result/AdventureExperience";
import { readOwnerToken } from "@/server/owner";

export const dynamic = "force-dynamic";

export default async function AdventurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await readOwnerToken();
  if (!owner) notFound();
  let session;
  try {
    session = await getOwnedSession(id, owner);
  } catch {
    notFound();
  }
  const view = await toAdventureView(session, false);
  const userId = await currentUserId();
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <AdventureExperience view={view} signedIn={Boolean(userId)} />
    </div>
  );
}
