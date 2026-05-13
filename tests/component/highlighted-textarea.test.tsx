import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HighlightedTextarea, type HighlightRange } from "@/shared/ui/highlighted-textarea";

function renderTextarea({
  ranges,
  text = "Первая ошибка\n\nДлинная строка с повторной ошибка после переноса",
  onHighlightClick = vi.fn(),
}: {
  ranges: HighlightRange[];
  text?: string;
  onHighlightClick?: ReturnType<typeof vi.fn>;
}) {
  const view = render(
    <HighlightedTextarea
      aria-label="Текст главы"
      value={text}
      highlightRanges={ranges}
      onChange={() => undefined}
      onHighlightClick={onHighlightClick}
    />,
  );

  return { ...view, onHighlightClick };
}

describe("HighlightedTextarea", () => {
  it("keeps textarea as the input source and renders clickable marks in a mirror layer", () => {
    const text = "Первая ошибка";
    const startOffset = text.indexOf("ошибка");
    const endOffset = startOffset + "ошибка".length;
    const { container, onHighlightClick } = renderTextarea({
      text,
      ranges: [
        {
          id: "issue-1",
          startOffset,
          endOffset,
          expectedText: "ошибка",
        },
      ],
    });

    const textarea = screen.getByLabelText("Текст главы");
    expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
    expect(textarea).toHaveAttribute("spellcheck", "false");
    expect(container.querySelector(".plotty-highlighted-textarea-shell")).toBeInTheDocument();

    const mark = container.querySelector('mark[data-error-id="issue-1"]');
    expect(mark).toHaveTextContent("ошибка");

    fireEvent.pointerDown(mark!);
    expect(onHighlightClick).toHaveBeenCalledTimes(1);
    expect(onHighlightClick.mock.calls[0][0]).toMatchObject({ id: "issue-1", startOffset, endOffset });
  });

  it("filters stale and overlapping ranges before rendering marks", () => {
    const text = "ошибка рядом ошибка";

    const { container } = renderTextarea({
      text,
      ranges: [
        {
          id: "stale",
          startOffset: 0,
          endOffset: 6,
          expectedText: "другое",
        },
        {
          id: "kept",
          startOffset: 0,
          endOffset: 6,
          expectedText: "ошибка",
        },
        {
          id: "overlap",
          startOffset: 2,
          endOffset: 8,
          expectedText: "ибка р",
        },
        {
          id: "second",
          startOffset: 13,
          endOffset: 19,
          expectedText: "ошибка",
        },
      ],
    });

    expect(container.querySelector('mark[data-error-id="stale"]')).not.toBeInTheDocument();
    expect(container.querySelector('mark[data-error-id="overlap"]')).not.toBeInTheDocument();
    expect(container.querySelectorAll("mark[data-error-id]")).toHaveLength(2);
    expect(container.querySelector('mark[data-error-id="kept"]')).toHaveTextContent("ошибка");
    expect(container.querySelector('mark[data-error-id="second"]')).toHaveTextContent("ошибка");
  });
});
