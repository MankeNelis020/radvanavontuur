import type { Dictionary } from "@/lib/i18n/dictionary";
import { preferences, type PreferenceId } from "@/lib/types";
import { cx } from "@/lib/cx";

export function PreferenceControls({
  dict,
  selected,
  onToggle,
}: {
  dict: Dictionary;
  selected: PreferenceId[];
  onToggle: (id: PreferenceId) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-heading text-base font-bold text-brand-primary-dark">{dict.spin.preferences}</legend>
      <div className="flex flex-wrap gap-2">
        {preferences.map((id) => {
          const pressed = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={pressed}
              onClick={() => onToggle(id)}
              className={cx(
                "min-h-11 rounded-button px-4 font-heading text-sm font-bold",
                pressed
                  ? "bg-brand-primary text-brand-background"
                  : "border border-brand-line bg-brand-background text-brand-primary",
              )}
            >
              {dict.preferences[id]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
