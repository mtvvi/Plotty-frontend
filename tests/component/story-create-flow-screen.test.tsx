import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StoryCreateFlowScreen } from "@/widgets/stories/story-create-flow-screen";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/write/new",
  useSearchParams: () => new URLSearchParams(),
}));

function renderCreateFlow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StoryCreateFlowScreen />
    </QueryClientProvider>,
  );
}

describe("StoryCreateFlowScreen", () => {
  it("moves through the flow step by step, then creates a first chapter and redirects to the editor", async () => {
    const user = userEvent.setup();

    renderCreateFlow();

    expect(screen.getByRole("button", { name: /Теги и категории/i })).toBeDisabled();

    await user.type(screen.getByLabelText("Название истории"), "Новая история для теста");
    await user.type(screen.getByLabelText("Описание"), "Описание новой истории");
    await user.type(screen.getByLabelText("Тизер"), "Тизер новой истории");

    await user.click(screen.getByRole("button", { name: /^Далее$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "DC" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "DC" }));
    await user.click(screen.getByRole("button", { name: "NC-17" }));
    await user.click(screen.getByRole("button", { name: "В процессе" }));
    await user.click(screen.getByRole("button", { name: "Макси" }));
    await user.click(screen.getByRole("button", { name: "Драма" }));

    await user.click(screen.getByRole("button", { name: /^Далее$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Сохранить историю" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Сохранить историю" }));

    await waitFor(() => expect(screen.getByLabelText("Название главы")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "В мастерскую" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Название главы"), "Глава 1");
    await user.type(screen.getByLabelText("Текст главы"), "Тестовый текст первой главы");
    await user.click(screen.getByRole("button", { name: "Создать главу и открыть редактор" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.calls.at(-1)?.[0]).toMatch(/^\/write\/stories\/story-\d+\/chapters\/chapter-\d+$/);
  });
});
