import Link from "next/link";
import { getDictionary } from "@/i18n/locale";

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl text-forest-950">{t.status.missingTitle}</h1>
      <p className="mt-2">{t.status.missingBody}</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-forest-800 underline">
        {t.status.home}
      </Link>
    </div>
  );
}
