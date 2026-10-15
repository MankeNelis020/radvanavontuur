import { cx } from "@/lib/cx";

const variants = {
  primary: "bg-brand-primary text-brand-background hover:bg-brand-primary-dark",
  secondary: "border border-brand-line bg-brand-surface text-brand-primary hover:border-brand-primary",
  adventure:
    "bg-brand-primary text-brand-background shadow-[inset_0_0_0_1.5px_var(--brand-accent)] hover:bg-brand-primary-dark",
} as const;

export type ButtonVariant = keyof typeof variants;

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-button px-6 text-center font-heading text-base font-bold tracking-tight no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function buttonClass(variant: ButtonVariant, className?: string) {
  return cx(base, variants[variant], className);
}
