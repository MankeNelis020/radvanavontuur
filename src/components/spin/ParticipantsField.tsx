"use client";

import { formatAge } from "@/domain/age";
import { Button } from "@/components/ui/Button";

export type ParticipantDraft = { id: string; ageMonths: number };

export function ParticipantsField({
  participants,
  onChange,
}: {
  participants: ParticipantDraft[];
  onChange: (next: ParticipantDraft[]) => void;
}) {
  function update(id: string, ageMonths: number) {
    onChange(participants.map((person) => (person.id === id ? { ...person, ageMonths } : person)));
  }

  return (
    <fieldset className="space-y-4">
      <legend className="font-display text-2xl">Wie gaan er mee?</legend>
      <p className="text-sm text-ink-soft">Onder de twee jaar kies je maanden. Daarna jaren.</p>
      {participants.map((person, index) => {
        const months = person.ageMonths < 24;
        const sliderId = `leeftijd-${person.id}`;
        return (
          <div key={person.id} className="rounded-3xl bg-cream-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={sliderId} className="font-semibold">
                Deelnemer {index + 1}
              </label>
              <output htmlFor={sliderId} className="font-display text-xl">
                {formatAge(person.ageMonths)}
              </output>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant={months ? "forest" : "quiet"}
                onClick={() => update(person.id, months ? person.ageMonths : 12)}
              >
                Maanden
              </Button>
              <Button
                type="button"
                variant={!months ? "forest" : "quiet"}
                onClick={() => update(person.id, months ? 30 * 12 : person.ageMonths)}
              >
                Jaren
              </Button>
            </div>
            <input
              id={sliderId}
              className="mt-4 w-full accent-forest-700"
              type="range"
              min={months ? 0 : 2}
              max={months ? 23 : 99}
              step={1}
              value={months ? person.ageMonths : Math.floor(person.ageMonths / 12)}
              aria-valuetext={formatAge(person.ageMonths)}
              onChange={(event) => {
                const value = Number(event.target.value);
                update(person.id, months ? value : value * 12);
              }}
            />
            {participants.length > 1 ? (
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-terracotta-700"
                onClick={() => onChange(participants.filter((item) => item.id !== person.id))}
              >
                Verwijder deelnemer
              </button>
            ) : null}
          </div>
        );
      })}
      <Button
        type="button"
        variant="quiet"
        onClick={() =>
          onChange([...participants, { id: crypto.randomUUID(), ageMonths: 8 * 12 }])
        }
      >
        Deelnemer toevoegen
      </Button>
    </fieldset>
  );
}
