import Link from "next/link";
import { currentUserId } from "@/auth/server";
import { getDictionary } from "@/i18n/locale";
import { getStore } from "@/persistence/get-store";
import { readOwnerToken } from "@/server/owner";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { locale, t } = await getDictionary();
  const owner = await readOwnerToken();
  const userId = await currentUserId();
  const store = getStore();
  const own = owner ? await store.listByOwner(owner) : [];
  const account = userId ? await store.listByUser(userId) : [];
  const sessions = [...own, ...account.filter((session) => !own.some((item) => item.id === session.id))];
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="font-display text-4xl text-forest-950">{t.history.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t.history.intro}</p>
      <ul className="mt-6 space-y-3">
        {sessions.length === 0 ? <li>{t.history.empty}</li> : null}
        {sessions.map((session) => {
          const current = session.selections[session.activeIndex];
          return (
            <li key={session.id} className="rounded-card bg-cream-100 p-4">
              <Link href={`/avontuur/${session.id}`} className="font-display text-2xl text-forest-950">
                {current?.destination.name ?? t.history.fallback}
              </Link>
              <p className="text-sm text-ink-soft">
                {session.status} · {new Date(session.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
