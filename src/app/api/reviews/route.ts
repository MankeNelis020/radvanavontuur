import { NextResponse } from "next/server";
import { z } from "zod";
import { submitReview } from "@/application/reviews";
import { currentUserId } from "@/auth/server";
import { readOwnerToken } from "@/server/owner";

const schema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional().default(""),
  tags: z.array(z.string()).max(6).optional().default([]),
});

export async function POST(request: Request) {
  const userId = await currentUserId();
  const owner = await readOwnerToken();
  if (!userId || !owner) {
    return NextResponse.json({ summary: "Log in om een review te schrijven. Het uitje zelf blijft zonder account te doen." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ summary: "De review is onvolledig." }, { status: 400 });
  const result = await submitReview({ ...parsed.data, ownerToken: owner, userId });
  if (!result.ok) return NextResponse.json({ summary: result.summary }, { status: 422 });
  return NextResponse.json({ status: result.status });
}
