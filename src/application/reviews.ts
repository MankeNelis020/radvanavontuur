import { REVIEW_TAGS } from "@/content/reviews";
import { getStore } from "@/persistence/get-store";

const BLOCKED = ["kanker", "neuk", "hoer", "tering"];

export { REVIEW_TAGS };

export function moderateReview(body: string): "published" | "held" {
  const normalized = body.toLowerCase();
  if (body.length > 2000) return "held";
  if (BLOCKED.some((word) => normalized.includes(word))) return "held";
  return "published";
}

export async function submitReview(input: {
  sessionId: string;
  ownerToken: string;
  userId: string;
  rating: number;
  body: string;
  tags: string[];
}): Promise<{ ok: true; status: "published" | "held" } | { ok: false; summary: string }> {
  const store = getStore();
  const session = await store.getSession(input.sessionId);
  if (!session || session.ownerToken !== input.ownerToken || session.userId !== input.userId) {
    return { ok: false, summary: "Alleen het account dat dit avontuur bewaart, kan een review schrijven." };
  }
  if (session.status !== "visit_self_confirmed") {
    return { ok: false, summary: "Een review kan pas na een eigen bevestiging dat je geweest bent. Een klik naar Maps telt niet." };
  }
  const current = session.selections[session.activeIndex];
  if (!current) return { ok: false, summary: "Geen bestemming gevonden." };
  if (await store.hasReview(input.userId, current.destination.id)) {
    return { ok: false, summary: "Je hebt deze bestemming al beoordeeld." };
  }
  const tags = input.tags.filter((tag) => REVIEW_TAGS.includes(tag as (typeof REVIEW_TAGS)[number])).slice(0, 6);
  const status = moderateReview(input.body);
  await store.addReview({
    id: crypto.randomUUID(),
    destinationId: current.destination.id,
    userId: input.userId,
    sessionId: session.id,
    rating: input.rating,
    body: input.body.trim(),
    tags,
    createdAt: new Date().toISOString(),
    status,
  });
  return { ok: true, status };
}
