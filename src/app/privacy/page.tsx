export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <h1 className="font-display text-4xl">Privacy</h1>
      <p>Je kunt draaien zonder account. Specifieke behoeften blijven op je eigen sessie en gaan niet mee in een deellink of naar een partner.</p>
      <p>
        Een gedeelde link bevat geen huislocatie. Wie draait, bewaart het startpunt bij de eigen sessie. Wie een gedeeld avontuur opent, kan zelf een locatie delen; dat punt blijft in die browser en slaan we niet op. Voor een plaatsnaam sturen we alleen een grof afgerond punt naar de geocoder, en we slaan dat verzoek niet op.
      </p>
      <p>Analytics starten pas na toestemming en bevatten geen precieze coördinaten. Een klik naar Maps is geen bezoek.</p>
      <p>Gastavonturen willen we na 30 dagen wissen. Reviews verdwijnen als het account verdwijnt. Partners kunnen een negatieve review niet laten verwijderen omdat ze betalen.</p>
    </article>
  );
}
