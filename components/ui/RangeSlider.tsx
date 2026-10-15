import { fill } from "@/lib/format";

export function RangeSlider({
  id,
  label,
  min,
  max,
  value,
  valueTemplate,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  valueTemplate: string;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  const display = fill(valueTemplate, { value });
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center justify-between gap-3 font-heading text-base font-bold text-brand-primary-dark">
        <span>{label}</span>
        <span className="tabular-nums text-brand-primary">{display}</span>
      </label>
      <input
        id={id}
        className="range"
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        style={{ ["--range-fill" as string]: `${percent}%` }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
