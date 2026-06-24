import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnimatedList, AnimatedTabPanel } from "@/shared/ui/motion";

describe("shared motion primitives", () => {
  it("keeps the list container mounted across item order changes without eager GSAP markers", () => {
    const firstItems = [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
    ];
    const nextItems = [...firstItems].reverse();

    const { container, rerender } = render(
      <AnimatedList
        items={firstItems}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
      />,
    );
    const list = container.querySelector("[data-motion-list='true']");

    rerender(
      <AnimatedList
        items={nextItems}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
      />,
    );

    expect(container.querySelector("[data-motion-list='true']")).toBe(list);
    expect(container.querySelector("[data-gsap-flip-list='true']")).toBeNull();
    expect(container.querySelector("[data-gsap-flip-id]")).toBeNull();
    expect(Array.from(container.querySelectorAll("[data-motion-list-item='true']")).map((node) => node.textContent)).toEqual([
      "Beta",
      "Alpha",
    ]);
  });

  it("marks animated tab panels for GSAP presence timelines", () => {
    const { container } = render(
      <AnimatedTabPanel activeKey="works" panelKey="works">
        Works
      </AnimatedTabPanel>,
    );

    expect(container.querySelector("[data-gsap-presence='tab-panel']")).not.toBeNull();
  });
});
