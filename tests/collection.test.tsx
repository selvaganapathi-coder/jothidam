import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";

import { CollectionGrid } from "@/components/collection/collection-grid";
import en from "@/messages/en.json";
import ta from "@/messages/ta.json";

const renderCollection = (collection: Record<string, number>) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CollectionGrid loadCollection={async () => collection} />
    </NextIntlClientProvider>,
  );

describe("CollectionGrid", () => {
  afterEach(() => cleanup());

  it("shows discovered cards unlocked and undiscovered cards locked", async () => {
    renderCollection({ c01: 1, c02: 2 });

    await waitFor(() => {
      expect(screen.getByTestId("collection-card-c01")).toHaveAttribute("data-locked", "false");
    });

    expect(screen.getByTestId("collection-card-c02")).toHaveAttribute("data-locked", "false");
    expect(screen.getByTestId("collection-card-c03")).toHaveAttribute("data-locked", "true");
    expect(screen.getByTestId("collection-card-c30")).toHaveAttribute("data-locked", "true");
    expect(screen.getByTestId("collection-card-c01")).toHaveTextContent("Lord Vinayagar");
  });

  it("shows the discovered count out of the full catalog", async () => {
    renderCollection({ c01: 1, c02: 3, c10: 1, c20: 2 });

    await waitFor(() => {
      expect(screen.getByTestId("collection-count")).toHaveTextContent("4/30");
    });
  });

  it("renders localized Tamil card text", async () => {
    render(
      <NextIntlClientProvider locale="ta" messages={ta}>
        <CollectionGrid loadCollection={async () => ({ c01: 1 })} />
      </NextIntlClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("collection-card-c01")).toHaveTextContent("விநாயகர்");
    });
  });

  it("filters cards by rarity", async () => {
    const user = userEvent.setup();
    renderCollection({});

    await waitFor(() => expect(screen.getByTestId("collection-grid")).toBeInTheDocument());
    await user.click(screen.getByTestId("collection-filter-epic"));

    expect(screen.getByTestId("collection-grid").querySelectorAll("[data-locked]")).toHaveLength(2);
  });
});
