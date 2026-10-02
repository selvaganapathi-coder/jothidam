import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

import { DailyPickExperience } from "@/components/home/daily-pick-experience";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tDisclaimer = await getTranslations("disclaimer");
  const tCollection = await getTranslations("collection");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 pb-10">
      <DailyPickExperience />
      <p className="px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {tDisclaimer("entertainment")}
      </p>
      <Link
        href="/collection"
        className="px-4 text-center text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        {tCollection("title")}
      </Link>
    </main>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
