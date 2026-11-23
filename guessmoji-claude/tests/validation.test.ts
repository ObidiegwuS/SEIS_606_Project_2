import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  PASSWORD_REQUIREMENTS,
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
  it("requires 7+ chars, upper, lower, and a special character", () => {
    expect(validateNewPassword("")).toBeDefined();
    expect(validateNewPassword("Ab!cde")).toBeDefined(); // 6 chars
    expect(validateNewPassword("abcdef!")).toBeDefined(); // no uppercase
    expect(validateNewPassword("ABCDEF!")).toBeDefined(); // no lowercase
    expect(validateNewPassword("Abcdefg")).toBeDefined(); // no special
    expect(validateNewPassword("Ab cdefg")).toBeDefined(); // space is not a special character
    expect(validateNewPassword("A!" + "a".repeat(127))).toMatch(/128/);
  });
  it("accepts valid passwords, with or without numbers", () => {
    expect(validateNewPassword("Abcdef!")).toBeUndefined(); // exactly 7, no digits
    expect(validateNewPassword("Emoji#2026")).toBeUndefined();
    for (const ch of "!@#$%&*") expect(validateNewPassword(`Abcdef${ch}`), ch).toBeUndefined();
  });
});

describe("PASSWORD_REQUIREMENTS", () => {
  it("reports each rule independently", () => {
    const met = (p: string) => PASSWORD_REQUIREMENTS.filter((r) => r.test(p)).map((r) => r.id);
    expect(met("")).toEqual([]);
    expect(met("a")).toEqual(["lower"]);
    expect(met("Abcdef!")).toEqual(["length", "upper", "lower", "special"]);
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
      password: "Emoji#2026",
      confirmPassword: "Emoji#2025",
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
