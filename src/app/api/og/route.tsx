import { ImageResponse } from "next/og";
import { z } from "zod";
import { enforceRateLimit, rejectUnexpectedOrigin } from "@/lib/security/api";

import { cardsCatalog, getCardById } from "@/lib/cards";

export const runtime = "edge";

const knownCardIds = new Set(cardsCatalog.cards.map((card) => card.id));

export const ogQuerySchema = z.object({
  card: z.string().refine((id) => knownCardIds.has(id), "Unknown card id"),
  lang: z.enum(["ta", "en"]).default("ta"),
});

const rarityStyles = {
  common: { background: "#F6E7C8", accent: "#8A5A22" },
  rare: { background: "#E8E4FF", accent: "#5B4BB7" },
  epic: { background: "#F8DFF0", accent: "#9A376F" },
} as const;

export function parseOgQuery(url: string) {
  const searchParams = new URL(url).searchParams;
  return ogQuerySchema.safeParse({
    card: searchParams.get("card") ?? undefined,
    lang: searchParams.get("lang") ?? undefined,
  });
}

export async function GET(request: Request) {
  const originError = rejectUnexpectedOrigin(request);
  if (originError) return originError;
  const rateLimitResponse = await enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  if ((request.headers.get("content-length") ?? "0") !== "0") {
    return Response.json({ error: "Request body not allowed" }, { status: 400 });
  }
  const parsed = parseOgQuery(request.url);
  if (!parsed.success) {
    return Response.json({ error: "Invalid OG card request" }, { status: 400 });
  }

  const card = getCardById(parsed.data.card);
  if (!card) {
    return Response.json({ error: "Invalid OG card request" }, { status: 400 });
  }

  const palette = rarityStyles[card.rarity];
  const symbol = card.symbol[parsed.data.lang];
  const message = card.message[parsed.data.lang];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "88px",
          background: palette.background,
          color: "#201A17",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: 1 }}>Aanmigam</div>
          <div
            style={{
              display: "flex",
              padding: "16px 28px",
              borderRadius: 999,
              background: palette.accent,
              color: "white",
              fontSize: 26,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {card.rarity}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 46 }}>
          <div style={{ fontSize: 94, lineHeight: 1.08, fontWeight: 800, color: palette.accent }}>
            {symbol}
          </div>
          <div style={{ fontSize: 58, lineHeight: 1.32, fontWeight: 650, maxWidth: 900 }}>
            {message}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 28, opacity: 0.72 }}>
          Your daily spiritual card · Aanmigam
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
