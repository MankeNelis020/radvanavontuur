import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl">Deze pagina is er niet</h1>
      <p className="mt-2">Het avontuur is verlopen of hoort bij een andere browser.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-forest-800 underline">
        Terug naar het begin
      </Link>
    </div>
  );
}
