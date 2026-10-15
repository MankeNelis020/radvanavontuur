"use client";

import { Button } from "@/components/ui/Button";
import { useCopy } from "@/i18n/context";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useCopy();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl text-forest-950">{t.status.errorTitle}</h1>
      <p className="mt-2 text-ink-soft">{t.status.errorBody}</p>
      <Button type="button" className="mt-6" onClick={() => reset()}>
        {t.status.retry}
      </Button>
    </div>
  );
}
