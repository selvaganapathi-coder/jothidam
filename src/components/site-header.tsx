import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { LanguageSwitcher } from "./language-switcher";

export async function SiteHeader() {
  const t = await getTranslations("app");

  return (
    <header className="flex w-full items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          href="/"
          className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          <h1 className="truncate text-lg font-semibold">{t("title")}</h1>
        </Link>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {t("tagline")}
        </p>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
