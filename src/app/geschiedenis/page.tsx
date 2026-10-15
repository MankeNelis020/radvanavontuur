import Link from "next/link";
import { currentUserId } from "@/auth/server";
import { getStore } from "@/persistence/get-store";
import { readOwnerToken } from "@/server/owner";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const owner = await readOwnerToken();
  const userId = await currentUserId();
  const store = getStore();
  const own = owner ? await store.listByOwner(owner) : [];
  const account = userId ? await store.listByUser(userId) : [];
  const sessions = [...own, ...account.filter((session) => !own.some((item) => item.id === session.id))];
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="font-display text-4xl">Geschiedenis</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Zonder Supabase blijven avonturen alleen op deze server staan. Een account neemt ze mee zodra je inlogt op hetzelfde apparaat.
      </p>
      <ul className="mt-6 space-y-3">
        {sessions.length === 0 ? <li>Nog geen avonturen in deze browser.</li> : null}
        {sessions.map((session) => {
          const current = session.selections[session.activeIndex];
          return (
            <li key={session.id} className="rounded-3xl bg-white p-4">
              <Link href={`/avontuur/${session.id}`} className="font-display text-2xl">
                {current?.destination.name ?? "Avontuur"}
              </Link>
              <p className="text-sm text-ink-soft">
                {session.status} · {new Date(session.createdAt).toLocaleDateString("nl-NL")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
