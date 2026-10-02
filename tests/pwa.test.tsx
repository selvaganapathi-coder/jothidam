import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InstallPrompt } from "@/components/pwa/install-prompt";

function createInstallEvent() {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: "accepted"; platform: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
  return event;
}

describe("InstallPrompt", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does not show on the first visit and shows after the second visit", () => {
    render(<InstallPrompt locale="en" />);
    expect(screen.queryByTestId("install-prompt")).not.toBeInTheDocument();

    cleanup();
    const event = createInstallEvent();
    render(<InstallPrompt locale="en" />);
    fireEvent(window, event);

    expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
    expect(window.localStorage.getItem("aanmigam.visit-count")).toBe("2");
  });

  it("remembers dismissal", () => {
    window.localStorage.setItem("aanmigam.visit-count", "1");
    window.localStorage.setItem("aanmigam.install-prompt-dismissed", "true");

    render(<InstallPrompt locale="en" />);
    fireEvent(window, createInstallEvent());

    expect(screen.queryByTestId("install-prompt")).not.toBeInTheDocument();
  });

  it("triggers the install prompt", async () => {
    window.localStorage.setItem("aanmigam.visit-count", "1");
    const event = createInstallEvent();
    render(<InstallPrompt locale="en" />);
    fireEvent(window, event);

    await fireEvent.click(screen.getByTestId("install-prompt-action"));
    expect(event.prompt).toHaveBeenCalledOnce();
  });
});
