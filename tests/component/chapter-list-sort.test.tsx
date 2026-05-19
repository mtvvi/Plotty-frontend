import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChapterSortButton } from "@/widgets/stories/chapter-list-sort";

describe("ChapterSortButton", () => {
  it("renders only the sort icon without the chapter range text", () => {
    render(<ChapterSortButton chapterCount={4} direction="desc" onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: /Порядок глав/ });

    expect(button.textContent).toBe("");
    expect(screen.queryByText("4 → 1")).not.toBeInTheDocument();
  });
});
