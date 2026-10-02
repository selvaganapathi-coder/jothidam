import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Tamil } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { FirebaseAuthProvider } from "@/components/firebase-auth-provider";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { SiteHeader } from "@/components/site-header";
import { routing, type AppLocale } from "@/i18n/routing";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-noto-sans-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
});

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const appLocale = locale as AppLocale;
  const bodyFont =
    appLocale === "ta" ? notoSansTamil.className : geistSans.className;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <body className={`flex min-h-full flex-col ${bodyFont}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FirebaseAuthProvider>
            <RegisterServiceWorker />
            <SiteHeader />
            {children}
            <InstallPrompt locale={appLocale} />
          </FirebaseAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
