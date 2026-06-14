import { describe, expect, it } from "vitest";

import { routes } from "@/shared/config/routes";

describe("routes", () => {
  it("encodes dynamic path segments", () => {
    expect(routes.user("../auth?next=/credits")).toBe("/users/..%2Fauth%3Fnext%3D%2Fcredits");
    expect(routes.userCollection("writer/name", "collection#1")).toBe(
      "/users/writer%2Fname/collections/collection%231",
    );
    expect(routes.story("a/b")).toBe("/stories/a%2Fb");
    expect(routes.chapter("a/b", 2)).toBe("/stories/a%2Fb/chapters/2");
    expect(routes.chapterPreview("a/b", "draft?x=1")).toBe("/stories/a%2Fb/preview/draft%3Fx%3D1");
    expect(routes.chapterEditor("story/1", "chapter?x=1")).toBe(
      "/write/stories/story%2F1/chapters/chapter%3Fx%3D1",
    );
  });
});
