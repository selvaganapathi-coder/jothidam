import type { AppLocale } from "@/i18n/routing";

export function buildCardShareUrl(
  origin: string,
  cardId: string,
  locale: AppLocale,
): string {
  const url = new URL("/api/og", origin);
  url.searchParams.set("card", cardId);
  url.searchParams.set("lang", locale);
  return url.toString();
}
