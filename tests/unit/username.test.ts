import { describe, expect, it } from "vitest";

import { isValidUsername, usernameValidationMessage } from "@/shared/lib/username";

describe("username", () => {
  it("accepts Latin, digits, underscore, length 3–40", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("user_42")).toBe(true);
    expect(isValidUsername("кириллица")).toBe(false);
    expect(isValidUsername("a-b")).toBe(false);
  });

  it("usernameValidationMessage explains issues", () => {
    expect(usernameValidationMessage("")).toMatch(/Введите/);
    expect(usernameValidationMessage("ab")).toMatch(/3/);
    expect(usernameValidationMessage("bad-name")).toMatch(/латиниц/i);
  });
});
