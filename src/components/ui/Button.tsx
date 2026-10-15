import type { ButtonHTMLAttributes } from "react";

const styles = {
  primary: "bg-forest-800 text-cream-50 hover:bg-forest-950",
  forest: "bg-forest-800 text-cream-50 hover:bg-forest-950",
  gold: "border border-gold-700 bg-cream-50 text-forest-800 shadow-[inset_0_0_0_1.5px_var(--brand-accent)] hover:bg-cream-100",
  quiet: "border border-forest-800/20 bg-cream-100 text-forest-800 hover:bg-cream-200",
  ghost: "bg-transparent text-forest-800 hover:bg-cream-100",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return (
    <button
      className={`touch-target inline-flex items-center justify-center rounded-full px-5 py-3 font-display text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
