import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";

type NotFoundProps = {
  params?: Promise<{ locale: string }>;
};

export default async function NotFound({ params }: NotFoundProps) {
  const resolved = params ? await params : { locale: routing.defaultLocale };
  setRequestLocale(resolved.locale);

  const t = await getTranslations("errors");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">{t("notFound")}</h1>
    </main>
  );
}
