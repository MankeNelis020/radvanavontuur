import Image from "next/image";
import { getDictionary } from "@/i18n/locale";

export default async function Loading() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-xl px-4 py-16" role="status">
      <Image src="/brand/icon.svg" alt="" width={128} height={128} className="h-16 w-16" />
      <p className="mt-4 font-display text-2xl text-forest-950">{t.status.loading}</p>
    </div>
  );
}
