import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { buttonClass } from "@/components/ui/button-styles";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function NotFoundState({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-start justify-center gap-4 px-5 py-16">
      <Logo variant="icon" className="h-14" />
      <h1 className="font-heading text-4xl font-extrabold">{dict.status.notFoundTitle}</h1>
      <p className="text-lg">{dict.status.notFoundBody}</p>
      <Link className={buttonClass("adventure")} href={`/${locale}`}>
        {dict.status.back}
      </Link>
    </div>
  );
}
