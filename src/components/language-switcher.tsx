"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

function getOtherLocale(locale: AppLocale): AppLocale {
  return locale === "ta" ? "en" : "ta";
}

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const t = useTranslations("language");

  const otherLocale = getOtherLocale(locale);
  const targetLabel = otherLocale === "en" ? t("english") : t("tamil");

  return (
    <Link
      href={pathname}
      locale={otherLocale}
      data-testid="language-switcher"
      className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
      aria-label={t("switch")}
    >
      {targetLabel}
    </Link>
  );
}
