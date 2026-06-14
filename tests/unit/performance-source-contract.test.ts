import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(path.resolve(relativePath), "utf8");
}

describe("performance source contract", () => {
  it("keeps catalog and reveal paths free of eager GSAP imports", () => {
    for (const sourcePath of [
      "src/widgets/stories/stories-catalog-shell.tsx",
      "src/shared/ui/story-reveal-transition.tsx",
      "src/shared/ui/motion.tsx",
    ]) {
      const source = readSource(sourcePath);

      expect(source).not.toContain("@/shared/lib/gsap-motion");
      expect(source).not.toContain("from \"gsap");
      expect(source).not.toContain("data-gsap-flip");
    }
  });

  it("keeps remaining route screens free of eager GSAP imports", () => {
    for (const sourcePath of [
      "src/widgets/auth/auth-screen.tsx",
      "src/widgets/credits/credits-screen.tsx",
      "src/widgets/profile/public-profile-screen.tsx",
      "src/widgets/profile/public-collection-screen.tsx",
      "src/widgets/stories/chapter-reader-screen.tsx",
    ]) {
      const source = readSource(sourcePath);

      expect(source).not.toContain("@/shared/lib/gsap-motion");
      expect(source).not.toContain("from \"gsap");
      expect(source).not.toContain("quickTo");
    }
  });

  it("exposes a catalog performance harness without committing generated reports", () => {
    const packageJson = JSON.parse(readSource("package.json")) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.["perf:catalog"]).toBe("node scripts/perf-catalog.mjs");
    expect(existsSync(path.resolve("scripts/perf-catalog.mjs"))).toBe(true);
  });

  it("exposes a multi-page performance harness without committing generated reports", () => {
    const packageJson = JSON.parse(readSource("package.json")) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.["perf:pages"]).toBe("node scripts/perf-pages.mjs");
    expect(existsSync(path.resolve("scripts/perf-pages.mjs"))).toBe(true);
  });

  it("keeps browser mocks out of the default client provider bundle", () => {
    const source = readSource("src/app/providers.tsx");

    expect(source).not.toContain('import { initializeMocks } from "@/mocks/browser"');
    expect(source).toContain('import("@/mocks/browser")');
  });

  it("does not prefetch secondary routes from shared navigation by default", () => {
    const buttonSource = readSource("src/shared/ui/button.tsx");
    const chromeSource = readSource("src/widgets/layout/plotty-page-shell.tsx");

    expect(buttonSource).toContain("prefetch = false");
    expect(chromeSource).toContain("prefetch={false}");
  });

  it("does not prefetch the credits route from balance affordances", () => {
    const balanceSource = readSource("src/widgets/credits/credit-balance-pill.tsx");
    const profileSource = readSource("src/widgets/profile/public-profile-screen.tsx");
    const editorFormSource = readSource("src/widgets/stories/story-editor-form.tsx");

    expect(balanceSource).toContain("prefetch={false}");
    expect(profileSource).toContain("prefetch={false}");
    expect(editorFormSource).toContain("prefetch={false}");
  });

  it("defers expensive profile works and search loading", () => {
    const source = readSource("src/widgets/profile/public-profile-screen.tsx");

    expect(source).toContain("enabled: profileQuery.isSuccess");
    expect(source).toContain("q: worksSearch");
    expect(source).not.toContain("profileWorksSearchPageSize");
    expect(source).not.toContain("isWorksSearchCollecting");
  });

  it("loads story shelf and collection controls lazily in repeated lists", () => {
    const shelfSource = readSource("src/widgets/stories/story-shelf-control.tsx");
    const collectionSource = readSource("src/widgets/stories/story-collection-control.tsx");
    const librarySource = readSource("src/widgets/library/reader-library-screen.tsx");

    expect(shelfSource).toContain("initialShelf");
    expect(shelfSource).toContain("enabled: isAuthenticated && shouldLoadShelf");
    expect(collectionSource).toContain("enabled: isAuthenticated && popover.open");
    expect(librarySource).toContain("initialShelf={entry.shelf}");
  });

  it("loads story detail fallback chapter imagery only after cached cover sources are exhausted", () => {
    const source = readSource("src/widgets/stories/story-details-screen.tsx");

    expect(source).toContain("findCachedStoryCoverImage");
    expect(source).toContain("getGeneratedStoryCoverUrl");
    expect(source).toContain("fallbackCoverLoadRequested");
    expect(source).toContain("enabled: Boolean(storyQuery.data && !storyCoverImage && fallbackCoverLoadRequested && firstChapter?.id)");
  });
});
