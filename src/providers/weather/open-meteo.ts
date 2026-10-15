import type { WeatherSnapshot } from "@/domain/types";
import type { WeatherProvider } from "@/providers/types";
import { fetchRetry } from "@/providers/http";
import { amsterdamParts } from "@/domain/time";
import { weatherCodeLabel } from "@/domain/engine/weather-rules";

type CacheEntry = { expires: number; value: WeatherSnapshot };

const cache = new Map<string, CacheEntry>();
const TTL_MS = 30 * 60 * 1000;

function hourKey(latitude: number, longitude: number, at: Date): string {
  const parts = amsterdamParts(at);
  return `${latitude.toFixed(2)}:${longitude.toFixed(2)}:${parts.year}-${parts.month}-${parts.day}-${parts.hour}`;
}

export function createOpenMeteoProvider(): WeatherProvider {
  return {
    mode: "live",
    label: "Open-Meteo",
    async getForecast({ latitude, longitude, at }) {
      const key = hourKey(latitude, longitude, at);
      const hit = cache.get(key);
      if (hit && hit.expires > Date.now()) {
        return { ...hit.value, status: "cached" };
      }
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", latitude.toFixed(4));
      url.searchParams.set("longitude", longitude.toFixed(4));
      url.searchParams.set(
        "hourly",
        "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code",
      );
      url.searchParams.set("timezone", "Europe/Amsterdam");
      url.searchParams.set("forecast_days", "3");
      url.searchParams.set("wind_speed_unit", "kmh");
      const response = await fetchRetry(url.toString());
      if (!response.ok) {
        throw new Error(`Open-Meteo antwoordde met ${response.status}.`);
      }
      const body = (await response.json()) as {
        hourly?: {
          time?: string[];
          temperature_2m?: number[];
          precipitation_probability?: number[];
          precipitation?: number[];
          wind_speed_10m?: number[];
          weather_code?: number[];
        };
      };
      const times = body.hourly?.time ?? [];
      const parts = amsterdamParts(at);
      const stamp = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:00`;
      let index = times.findIndex((time) => time.startsWith(stamp));
      if (index < 0) index = 0;
      const code = body.hourly?.weather_code?.[index] ?? null;
      const snapshot: WeatherSnapshot = {
        status: "live",
        observedAt: new Date().toISOString(),
        validFor: times[index] ?? null,
        temperatureC: body.hourly?.temperature_2m?.[index] ?? null,
        precipitationProbability: body.hourly?.precipitation_probability?.[index] ?? null,
        precipitationMm: body.hourly?.precipitation?.[index] ?? null,
        windSpeedKmh: body.hourly?.wind_speed_10m?.[index] ?? null,
        weatherCode: code,
        officialWarningChecked: false,
        summaryNl: `Modelverwachting: ${weatherCodeLabel(code)}. Geen officiële waarschuwing gecontroleerd.`,
      };
      cache.set(key, { expires: Date.now() + TTL_MS, value: snapshot });
      return snapshot;
    },
  };
}

export function unavailableWeather(reason: string): WeatherSnapshot {
  return {
    status: "unavailable",
    observedAt: null,
    validFor: null,
    temperatureC: null,
    precipitationProbability: null,
    precipitationMm: null,
    windSpeedKmh: null,
    weatherCode: null,
    officialWarningChecked: false,
    summaryNl: reason,
  };
}

export function createFixtureWeather(): WeatherProvider {
  return {
    mode: "fixture",
    label: "Ontwikkelweer, geen live meting",
    async getForecast() {
      return {
        status: "fixture",
        observedAt: new Date().toISOString(),
        validFor: null,
        temperatureC: 18,
        precipitationProbability: 10,
        precipitationMm: 0,
        windSpeedKmh: 12,
        weatherCode: 1,
        officialWarningChecked: false,
        summaryNl: "Vast testweer: 18 °C en droog. Dit is geen live verwachting.",
      };
    },
  };
}

export function createWeatherProvider(): WeatherProvider {
  const choice = process.env.WEATHER_PROVIDER ?? "open-meteo";
  if (choice === "fixture") {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_FIXTURE_PROVIDERS !== "true") {
      return {
        mode: "unavailable",
        label: "Weerprovider geweigerd",
        async getForecast() {
          return unavailableWeather(
            "Een vast testweer is in productie niet toegestaan. Er is geen live weer opgehaald.",
          );
        },
      };
    }
    return createFixtureWeather();
  }
  if (choice === "unavailable") {
    return {
      mode: "unavailable",
      label: "Weer niet geconfigureerd",
      async getForecast() {
        return unavailableWeather("Weerinformatie is niet beschikbaar.");
      },
    };
  }
  return createOpenMeteoProvider();
}
