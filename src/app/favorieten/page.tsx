import Link from "next/link";
import { getCatalogDestination } from "@/data/catalog";
import { currentUserId } from "@/auth/server";
import { getDictionary } from "@/i18n/locale";
import { getStore } from "@/persistence/get-store";
import { readOwnerToken } from "@/server/owner";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const { t } = await getDictionary();
  const owner = await readOwnerToken();
  const userId = await currentUserId();
  const store = getStore();
  const sessions = owner ? (await store.listByOwner(owner)).filter((session) => session.favorite) : [];
  const ids = userId ? await store.listFavorites(userId) : [];
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="font-display text-4xl text-forest-950">{t.favorites.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t.favorites.intro}</p>
      <ul className="mt-6 space-y-3">
        {sessions.map((session) => {
          const current = session.selections[session.activeIndex];
          if (!current) return null;
          return (
            <li key={session.id}>
              <Link className="font-semibold" href={`/avontuur/${session.id}`}>
                {current.destination.name}
              </Link>
            </li>
          );
        })}
        {ids.map((id) => (
          <li key={id}>{getCatalogDestination(id)?.name ?? id}</li>
        ))}
        {sessions.length === 0 && ids.length === 0 ? <li>{t.favorites.empty}</li> : null}
      </ul>
    </div>
  );
}
