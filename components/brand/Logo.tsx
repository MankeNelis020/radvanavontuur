import Image from "next/image";
import { cx } from "@/lib/cx";

const sources = {
  horizontal: { src: "/brand/logo-horizontal.svg", width: 478, height: 128 },
  compact: { src: "/brand/logo-compact.svg", width: 347, height: 96 },
  icon: { src: "/brand/icon.svg", width: 128, height: 128 },
  mono: { src: "/brand/logo-mono.svg", width: 128, height: 128 },
} as const;

type Variant = keyof typeof sources;

export function Logo({
  variant,
  className,
  priority = false,
}: {
  variant: Variant;
  className?: string;
  priority?: boolean;
}) {
  const source = sources[variant];
  return (
    <Image
      src={source.src}
      alt="Wondaro"
      width={source.width}
      height={source.height}
      priority={priority}
      className={cx("h-11 w-auto", className)}
    />
  );
}
