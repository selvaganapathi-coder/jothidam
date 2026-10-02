import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";

type CollectionPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("collection");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("empty")}</p>
    </main>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
