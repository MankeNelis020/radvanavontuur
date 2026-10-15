import { Logo } from "@/components/brand/Logo";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-auto border-t border-brand-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo variant="compact" className="h-9" />
        <div className="max-w-md space-y-1">
          <p className="font-heading font-bold text-brand-primary-dark">{dict.tagline}</p>
          <p className="text-sm text-brand-text-muted">{dict.footer.independence}</p>
        </div>
      </div>
    </footer>
  );
}
