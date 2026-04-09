import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChapterImageFrame } from "@/widgets/stories/chapter-image-frame";

describe("ChapterImageFrame", () => {
  it("renders a square placeholder when there is no image", () => {
    render(<ChapterImageFrame title="Глава 1" />);

    expect(screen.getByText("Иллюстрация").closest('[data-chapter-image-frame="true"]')).toHaveClass("aspect-square");
  });

  it("renders image content inside a square surface", () => {
    render(<ChapterImageFrame title="Глава 1" imageUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'/%3E" />);

    expect(screen.getByAltText("Глава 1")).toBeInTheDocument();
    expect(screen.getByAltText("Глава 1").closest('[data-chapter-image-surface="true"]')).toHaveClass("aspect-square");
  });
});
