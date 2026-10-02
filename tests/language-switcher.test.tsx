import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LanguageSwitcher } from "@/components/language-switcher";
import en from "@/messages/en.json";
import ta from "@/messages/ta.json";

const mockPathname = "/collection";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    locale,
    ...props
  }: {
    children: ReactNode;
    href: string;
    locale?: string;
  }) => (
    <a href={`/${locale ?? "en"}${href}`} data-locale={locale} {...props}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
}));

describe("LanguageSwitcher", () => {
  afterEach(() => {
    cleanup();
  });

  it("links to Tamil when locale is English", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    );

    const switcher = screen.getByTestId("language-switcher");
    expect(switcher).toHaveTextContent("Tamil");
    expect(switcher).toHaveAttribute("href", "/ta/collection");
    expect(switcher).toHaveAttribute("data-locale", "ta");
  });

  it("links to English when locale is Tamil", () => {
    render(
      <NextIntlClientProvider locale="ta" messages={ta}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    );

    const switcher = screen.getByTestId("language-switcher");
    expect(switcher).toHaveTextContent("ஆங்கிலம்");
    expect(switcher).toHaveAttribute("href", "/en/collection");
    expect(switcher).toHaveAttribute("data-locale", "en");
  });
});
