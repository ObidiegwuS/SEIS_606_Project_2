import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  safeRedirectPath,
  validateEmail,
  validateLogin,
  validateNewPassword,
  validateRegistration,
} from "@/lib/validation";

describe("validateEmail", () => {
  it("rejects empty and whitespace-only input", () => {
    expect(validateEmail("")).toMatch(/enter your email/i);
    expect(validateEmail("   ")).toMatch(/enter your email/i);
  });
  it("rejects malformed addresses", () => {
    for (const bad of ["player", "player@", "@example.com", "player@example", "pl ayer@example.com"]) {
      expect(validateEmail(bad), bad).toBeDefined();
    }
  });
  it("accepts valid addresses, ignoring surrounding spaces", () => {
    expect(validateEmail("player@example.com")).toBeUndefined();
    expect(validateEmail("  Player.One@Example.org  ")).toBeUndefined();
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Player@Example.COM ")).toBe("player@example.com");
  });
});

describe("validateNewPassword", () => {
  it("enforces length and character rules", () => {
    expect(validateNewPassword("")).toBeDefined();
    expect(validateNewPassword("abc12")).toMatch(/at least 8/);
    expect(validateNewPassword("abcdefgh")).toMatch(/letter and one number/);
    expect(validateNewPassword("12345678")).toMatch(/letter and one number/);
    expect(validateNewPassword("a".repeat(128) + "1")).toMatch(/128/);
    expect(validateNewPassword("emoji4ever")).toBeUndefined();
  });
});

describe("form validators", () => {
  it("login only requires presence of a password", () => {
    expect(validateLogin({ email: "player@example.com", password: "x" })).toEqual({});
    expect(Object.keys(validateLogin({ email: "", password: "" }))).toEqual(["email", "password"]);
  });
  it("registration requires matching passwords", () => {
    const errors = validateRegistration({
      email: "player@example.com",
      password: "emoji4ever",
      confirmPassword: "emoji4evr",
    });
    expect(errors).toEqual({ confirmPassword: "Passwords do not match." });
  });
});

describe("safeRedirectPath", () => {
  it("allows relative paths", () => {
    expect(safeRedirectPath("/home")).toBe("/home");
  });
  it("blocks open redirects", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "home", "", null, undefined]) {
      expect(safeRedirectPath(bad as string | null | undefined)).toBe("/home");
    }
  });
});
