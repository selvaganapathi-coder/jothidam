import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tHome = await getTranslations("home");
  const tDisclaimer = await getTranslations("disclaimer");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-4">
        <button
          type="button"
          className="w-fit rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {tHome("pickCard")}
        </button>
        <p className="text-zinc-600 dark:text-zinc-400">
          {tHome("comeBackTomorrow")}
        </p>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {tHome("streak", { count: 0 })}
        </p>
      </section>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {tDisclaimer("entertainment")}
      </p>
      <Link
        href="/collection"
        className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        {(await getTranslations("collection"))("title")}
      </Link>
    </main>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
