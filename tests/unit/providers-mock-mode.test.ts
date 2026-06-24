import { describe, expect, it } from "vitest";

import { shouldInitializeBrowserMocks } from "@/app/providers";

describe("browser mock mode", () => {
  it("does not initialize MSW in production even if the public flag is enabled", () => {
    expect(shouldInitializeBrowserMocks({ nodeEnv: "production", apiMocking: "enabled" })).toBe(false);
  });

  it("initializes MSW only when explicitly enabled outside production", () => {
    expect(shouldInitializeBrowserMocks({ nodeEnv: "development", apiMocking: "enabled" })).toBe(true);
    expect(shouldInitializeBrowserMocks({ nodeEnv: "development", apiMocking: "disabled" })).toBe(false);
  });
});
