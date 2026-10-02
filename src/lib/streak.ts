import { describe, expect, it } from "vitest";

import {
  calculateStreak,
  getDateKey,
  getNextPickAt,
  getPreviousDateKey,
} from "@/lib/streak";

describe("streak date logic", () => {
  it("continues the streak after yesterday", () => {
    expect(calculateStreak("2026-10-01", "2026-10-02", 4)).toBe(5);
  });

  it("resets after a gap", () => {
    expect(calculateStreak("2026-09-30", "2026-10-02", 4)).toBe(1);
  });

  it("handles IST midnight boundaries", () => {
    expect(getDateKey(new Date("2026-10-02T23:59:00+05:30"))).toBe("2026-10-02");
    expect(getDateKey(new Date("2026-10-03T00:01:00+05:30"))).toBe("2026-10-03");
  });

  it("handles month rollover", () => {
    expect(getPreviousDateKey("2026-03-01")).toBe("2026-02-28");
    expect(calculateStreak("2026-02-28", "2026-03-01", 2)).toBe(3);
  });

  it("handles year rollover", () => {
    expect(getPreviousDateKey("2027-01-01")).toBe("2026-12-31");
    expect(calculateStreak("2026-12-31", "2027-01-01", 2)).toBe(3);
  });

  it("handles leap day", () => {
    expect(getPreviousDateKey("2028-03-01")).toBe("2028-02-29");
    expect(calculateStreak("2028-02-29", "2028-03-01", 2)).toBe(3);
  });

  it("returns the next IST midnight", () => {
    expect(getNextPickAt("2026-10-02")).toBe("2026-10-02T18:30:00.000Z");
  });
});
