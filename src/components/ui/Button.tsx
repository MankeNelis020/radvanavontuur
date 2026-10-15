import type { ButtonHTMLAttributes } from "react";

const styles = {
  primary: "bg-terracotta-500 text-cream-50 hover:bg-terracotta-700",
  forest: "bg-forest-800 text-cream-50 hover:bg-forest-950",
  gold: "bg-gold-400 text-ink hover:bg-gold-700 hover:text-cream-50",
  quiet: "bg-cream-100 text-ink hover:bg-cream-200",
  ghost: "bg-transparent text-forest-900 hover:bg-cream-100",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return (
    <button
      className={`touch-target inline-flex items-center justify-center rounded-full px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
