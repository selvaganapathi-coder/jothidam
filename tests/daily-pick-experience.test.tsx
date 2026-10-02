import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DailyPickExperience } from "@/components/home/daily-pick-experience";
import { getCardById } from "@/lib/cards";
import type { RequestPickFn } from "@/lib/request-daily-pick";
import en from "@/messages/en.json";

const sampleCard = getCardById("c01");

function renderExperience(options?: {
  requestPick?: RequestPickFn;
  initialViewState?: Parameters<
    typeof DailyPickExperience
  >[0]["initialViewState"];
}) {
  if (!sampleCard) {
    throw new Error("Expected sample card c01");
  }

  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <DailyPickExperience
        requestPick={options?.requestPick}
        initialViewState={options?.initialViewState}
      />
    </NextIntlClientProvider>,
  );
}

describe("DailyPickExperience", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders idle state with five face-down cards and enabled pick button", () => {
    renderExperience();

    expect(screen.getByTestId("daily-pick-experience")).toHaveAttribute(
      "data-status",
      "idle",
    );
    expect(screen.getAllByTestId(/^fortune-card-\d+$/)).toHaveLength(5);
    expect(screen.queryByTestId("fortune-card-face")).not.toBeInTheDocument();
    expect(screen.getByTestId("daily-pick-button")).toBeEnabled();
  });

  it("enters loading state while the mocked pick is in progress", async () => {
    const user = userEvent.setup();
    let resolvePick: (
      value: Awaited<ReturnType<RequestPickFn>>,
    ) => void = () => {
      /* set in promise */
    };

    const pendingPick = new Promise<Awaited<ReturnType<RequestPickFn>>>(
      (resolve) => {
        resolvePick = resolve;
      },
    );

    const requestPick: RequestPickFn = () => pendingPick;

    renderExperience({ requestPick });

    await user.click(screen.getByTestId("daily-pick-button"));

    expect(screen.getByTestId("daily-pick-experience")).toHaveAttribute(
      "data-status",
      "loading",
    );
    expect(screen.getByTestId("daily-pick-button")).toHaveAttribute(
      "aria-busy",
      "true",
    );

    resolvePick({
      ok: true,
      card: sampleCard!,
      cardIndex: 2,
    });

    await waitFor(() => {
      expect(screen.getByTestId("daily-pick-experience")).toHaveAttribute(
        "data-status",
        "result",
      );
    });
  });

  it("shows the flipped card result with symbol, message, and rarity badge", async () => {
    const user = userEvent.setup();
    const requestPick: RequestPickFn = async () => ({
      ok: true,
      card: sampleCard!,
      cardIndex: 1,
    });

    renderExperience({ requestPick });

    await user.click(screen.getByTestId("daily-pick-button"));

    await waitFor(() => {
      expect(screen.getByTestId("fortune-card-1")).toHaveAttribute(
        "data-flipped",
        "true",
      );
    });

    const face = screen.getByTestId("fortune-card-face");
    expect(face).toHaveTextContent("Lord Vinayagar");
    expect(face).toHaveTextContent(sampleCard!.message.en);
    expect(face).toHaveTextContent("Common");
    expect(screen.getByTestId("daily-pick-result-summary")).toBeInTheDocument();
  });

  it("renders already-picked-today state", () => {
    renderExperience({
      initialViewState: { kind: "already-picked-today" },
    });

    expect(screen.getByTestId("daily-pick-experience")).toHaveAttribute(
      "data-status",
      "already-picked-today",
    );
    expect(screen.getByTestId("daily-pick-already-picked")).toHaveTextContent(
      "You already picked your card today",
    );
    expect(screen.getByTestId("daily-pick-button")).toBeDisabled();
  });

  it("renders error state and allows retry", async () => {
    const user = userEvent.setup();
    const requestPick = vi
      .fn<RequestPickFn>()
      .mockResolvedValueOnce({ ok: false, reason: "error" })
      .mockResolvedValueOnce({
        ok: true,
        card: sampleCard!,
        cardIndex: 0,
      });

    renderExperience({ requestPick });

    await user.click(screen.getByTestId("daily-pick-button"));

    await waitFor(() => {
      expect(screen.getByTestId("daily-pick-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("daily-pick-button")).toHaveTextContent(
      "Try again",
    );

    await user.click(screen.getByTestId("daily-pick-button"));

    await waitFor(() => {
      expect(screen.getByTestId("fortune-card-face")).toBeInTheDocument();
    });
  });
});
