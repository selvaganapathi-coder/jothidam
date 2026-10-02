import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import ta from "@/messages/ta.json";
import { flattenMessageKeys } from "@/lib/message-keys";

describe("message catalogs", () => {
  it("uses identical keys in en and ta", () => {
    const enKeys = flattenMessageKeys(en).sort();
    const taKeys = flattenMessageKeys(ta).sort();

    expect(enKeys).toEqual(taKeys);
  });
});
