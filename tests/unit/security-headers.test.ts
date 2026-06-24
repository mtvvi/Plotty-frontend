import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("Next security headers", () => {
  it("sets baseline browser security headers for every route", async () => {
    const headers = await nextConfig.headers?.();
    const allRoutes = headers?.find((item) => item.source === "/:path*");
    const headerMap = new Map(allRoutes?.headers.map((header) => [header.key.toLowerCase(), header.value]));

    expect(headerMap.get("content-security-policy")).toContain("base-uri 'none'");
    expect(headerMap.get("content-security-policy")).toContain("form-action 'self'");
    expect(headerMap.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(headerMap.get("referrer-policy")).toBe("no-referrer");
    expect(headerMap.get("permissions-policy")).toContain("camera=()");
    expect(headerMap.get("x-content-type-options")).toBe("nosniff");
    expect(headerMap.get("x-frame-options")).toBe("DENY");
  });
});
