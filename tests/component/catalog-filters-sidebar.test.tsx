import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { defaultCatalogQuery } from "@/entities/catalog/model/catalog-query";
import { catalogMeta } from "@/mocks/data/catalog";
import { CatalogFiltersSidebar } from "@/widgets/catalog/catalog-filters-sidebar";

describe("CatalogFiltersSidebar", () => {
  it("calls onChange when a filter chip is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<CatalogFiltersSidebar query={defaultCatalogQuery} meta={catalogMeta} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Harry Potter" }));

    expect(onChange).toHaveBeenCalledWith({ fandom: "Harry Potter", page: 1 });
  });
});
