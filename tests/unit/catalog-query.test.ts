import { describe, expect, it } from "vitest";

import {
  defaultCatalogQuery,
  parseCatalogQuery,
  serializeCatalogQuery,
} from "@/entities/catalog/model/catalog-query";

describe("catalog query helpers", () => {
  it("serializes only non-default values", () => {
    const params = serializeCatalogQuery({
      ...defaultCatalogQuery,
      q: "драко",
      fandom: "Harry Potter",
      view: "tiles",
    });

    expect(params.toString()).toBe("q=%D0%B4%D1%80%D0%B0%D0%BA%D0%BE&fandom=Harry+Potter&view=tiles");
  });

  it("parses valid values and falls back for invalid ones", () => {
    const params = new URLSearchParams({
      q: "магия",
      fandom: "Harry Potter",
      status: "in-progress",
      rating: "R",
      size: "midi",
      sort: "popular",
      view: "tiles",
      page: "2",
    });

    expect(parseCatalogQuery(params)).toEqual({
      q: "магия",
      fandom: "Harry Potter",
      status: "in-progress",
      rating: "R",
      size: "midi",
      sort: "popular",
      view: "tiles",
      page: 2,
    });
  });

  it("drops unsupported query values", () => {
    const params = new URLSearchParams({
      status: "wrong",
      rating: "X",
      size: "huge",
      sort: "newest",
      page: "-1",
    });

    expect(parseCatalogQuery(params)).toEqual(defaultCatalogQuery);
  });
});

