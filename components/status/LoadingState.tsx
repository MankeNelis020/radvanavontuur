import { Logo } from "@/components/brand/Logo";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-5 text-center" role="status">
      <div className="mark-drift">
        <Logo variant="icon" className="h-16" />
      </div>
      <p className="font-heading text-lg font-bold text-brand-primary-dark">{label}</p>
    </div>
  );
}
