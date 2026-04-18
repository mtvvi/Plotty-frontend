import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StoryDetailsScreen } from "@/widgets/stories/story-details-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/stories/after-midnight-the-snow-does-not-melt",
  useSearchParams: () => new URLSearchParams(),
}));

function renderStoryDetails() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StoryDetailsScreen slug="after-midnight-the-snow-does-not-melt" />
    </QueryClientProvider>,
  );
}

describe("StoryDetailsScreen", () => {
  it("renders cover, read CTA, AI annotation and chapters access without authoring controls", async () => {
    renderStoryDetails();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "РџРѕСЃР»Рµ РїРѕР»СѓРЅРѕС‡Рё СЃРЅРµРі РЅРµ С‚Р°РµС‚" })).toBeInTheDocument(),
    );

    expect(screen.getByAltText("РћР±Р»РѕР¶РєР° РёСЃС‚РѕСЂРёРё В«РџРѕСЃР»Рµ РїРѕР»СѓРЅРѕС‡Рё СЃРЅРµРі РЅРµ С‚Р°РµС‚В»")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Р§РёС‚Р°С‚СЊ" })[0]).toHaveAttribute(
      "href",
      "/stories/after-midnight-the-snow-does-not-melt/chapters/1",
    );
    expect(screen.getByRole("button", { name: "РћРїРёСЃР°РЅРёРµ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Р“Р»Р°РІС‹" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "РљРѕРјРјРµРЅС‚Р°СЂРёРё" })).toBeInTheDocument();
    expect(screen.getByText(/AI Р°РІС‚РѕСЂР°: 2 Р·Р°РјРµС‡Р°РЅРёСЏ РїРѕ РєР°РЅРѕРЅСѓ/i)).toBeInTheDocument();
    expect(document.querySelector("#story-content")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "РЈРґР°Р»РёС‚СЊ РёСЃС‚РѕСЂРёСЋ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "РќР°СЃС‚СЂРѕР№РєРё РёСЃС‚РѕСЂРёРё" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "РќРѕРІР°СЏ РіР»Р°РІР°" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РіР»Р°РІСѓ" })).not.toBeInTheDocument();
  });
});
