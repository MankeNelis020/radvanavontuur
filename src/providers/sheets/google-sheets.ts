import { createSign } from "node:crypto";
import { fetchWithTimeout } from "@/providers/http";

type ServiceAccount = { client_email: string; private_key: string };

function loadAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(json) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) return null;
  return parsed;
}

async function accessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(account.private_key).toString("base64url");
  const response = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) throw new Error("Google-token kon niet worden opgehaald.");
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("Google-token ontbreekt.");
  return body.access_token;
}

export async function readWorksheets(): Promise<{
  destinations: string[][];
  partners: string[][];
  promotions: string[][];
  quality: string[][];
} | null> {
  const account = loadAccount();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!account || !spreadsheetId) return null;
  const token = await accessToken(account);
  const ranges = ["Destinations", "Partners", "Promotions", "Data Quality"];
  const matrices = await Promise.all(
    ranges.map(async (range) => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
      const response = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return [] as string[][];
      const body = (await response.json()) as { values?: string[][] };
      return body.values ?? [];
    }),
  );
  return {
    destinations: matrices[0] ?? [],
    partners: matrices[1] ?? [],
    promotions: matrices[2] ?? [],
    quality: matrices[3] ?? [],
  };
}

export function sheetsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
}
