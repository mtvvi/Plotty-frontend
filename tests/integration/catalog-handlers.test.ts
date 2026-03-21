import { describe, expect, it } from "vitest";

describe("catalog mock handlers", () => {
  it("filters stories by fandom", async () => {
    const response = await fetch("http://localhost/catalog?fandom=Harry+Potter");
    const data = (await response.json()) as { total: number; items: Array<{ fandom: string }> };

    expect(response.ok).toBe(true);
    expect(data.total).toBe(1);
    expect(data.items[0]?.fandom).toBe("Harry Potter");
  });

  it("filters stories by search query", async () => {
    const response = await fetch("http://localhost/catalog?q=%D0%B4%D1%80%D0%B0%D0%BA%D0%BE");
    const data = (await response.json()) as { total: number; items: Array<{ title: string }> };

    expect(response.ok).toBe(true);
    expect(data.total).toBeGreaterThan(0);
    expect(data.items.some((item) => item.title.includes("После полуночи"))).toBe(true);
  });
});

