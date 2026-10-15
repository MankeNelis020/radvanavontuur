"use client";

import { ErrorState } from "@/components/status/ErrorState";

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState reset={reset} />;
}
