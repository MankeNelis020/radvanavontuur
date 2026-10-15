"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { LoadingState } from "@/components/status/LoadingState";
import { buttonClass } from "@/components/ui/button-styles";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { forgetDeviceEmail, readDeviceEmail, readSpin, saveDeviceEmail } from "@/lib/session";
import type { SpinRecord } from "@/lib/types";

export function AccountScreen({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [record, setRecord] = useState<SpinRecord | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readDeviceEmail();
      setEmail(stored);
      setSaved(stored.length > 0);
      setRecord(readSpin());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return <LoadingState label={dict.status.loading} />;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDeviceEmail(email.trim());
    setSaved(true);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-2 md:py-16">
      <section className="rounded-card bg-brand-surface p-6 md:p-8">
        <h1 className="font-heading text-4xl font-extrabold">{dict.account.title}</h1>
        <p className="mt-3">{dict.account.intro}</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block font-heading font-bold text-brand-primary-dark">
              {dict.account.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSaved(false);
              }}
              className="min-h-12 w-full rounded-input border border-brand-line bg-brand-background px-4 text-brand-text"
            />
          </div>
          <Button variant="primary" type="submit">
            {dict.account.continue}
          </Button>
          {saved && (
            <p role="status" className="font-heading font-bold text-brand-primary">
              {dict.account.saved}
            </p>
          )}
          {saved && (
            <Button
              variant="secondary"
              onClick={() => {
                forgetDeviceEmail();
                setEmail("");
                setSaved(false);
              }}
            >
              {dict.account.forget}
            </Button>
          )}
        </form>
        <p className="mt-6 text-sm text-brand-text-muted">{dict.account.privacy}</p>
      </section>
      <section className="rounded-card border border-brand-line bg-brand-background p-6 shadow-soft md:p-8">
        <h2 className="font-heading text-2xl font-extrabold">{dict.account.latest}</h2>
        {record ? (
          <div className="mt-4 space-y-4">
            <p className="font-heading text-sm font-bold text-brand-primary">{dict.segments[record.segment]}</p>
            <p className="font-heading text-3xl font-extrabold text-brand-primary-dark">
              {dict.adventures[record.segment].title}
            </p>
            <p>{dict.adventures[record.segment].summary}</p>
            <Link className={buttonClass("adventure")} href={`/${locale}/results`}>
              {dict.results.title}
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p>{dict.account.none}</p>
            <Link className={buttonClass("secondary")} href={`/${locale}/spin`}>
              {dict.spin.spin}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
