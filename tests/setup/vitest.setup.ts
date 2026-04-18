import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";

import { resetMockAuthDb } from "@/mocks/data/auth";
import { resetMockStoriesDb } from "@/mocks/data/stories";
import { server } from "@/mocks/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  resetMockAuthDb();
  resetMockStoriesDb();
});

afterAll(() => {
  server.close();
});
