import { getTranslations, setRequestLocale } from "next-intl/server";

import { CollectionGrid } from "@/components/collection/collection-grid";
import { routing } from "@/i18n/routing";

type CollectionPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("collection");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <CollectionGrid />
    </main>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
