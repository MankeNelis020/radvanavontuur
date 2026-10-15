import { getDictionary } from "@/i18n/locale";

export default async function AboutPage() {
  const { t } = await getDictionary();
  return (
    <article className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <h1 className="font-display text-4xl text-forest-950">{t.about.title}</h1>
      <p>{t.about.p1}</p>
      <p>{t.about.p2}</p>
      <p>{t.about.p3}</p>
    </article>
  );
}
