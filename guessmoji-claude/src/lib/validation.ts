/**
 * Client-side validation rules shared by the login and registration forms.
 * These are a usability aid only — the backend must re-validate every request.
 */

export const PASSWORD_MIN_LENGTH = 7;
export const PASSWORD_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 254;

// Pragmatic check: something@something.tld, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(raw: string): string | undefined {
  const email = raw.trim();
  if (!email) return "Enter your email address.";
  if (email.length > EMAIL_MAX_LENGTH) return "Email address is too long.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address, like name@example.com.";
  return undefined;
}

/** Login only checks presence; strength rules apply at registration. */
export function validateLoginPassword(password: string): string | undefined {
  if (!password) return "Enter your password.";
  return undefined;
}

/** Any character that is not a letter, digit, or whitespace, e.g. ! @ # $ % & * */
const SPECIAL_CHAR = /[^A-Za-z0-9\s]/;

/**
 * Password rules, in display order. Shown as a live checklist under the
 * password field and enforced again on the server.
 */
export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (p: string) => p.length >= PASSWORD_MIN_LENGTH },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "special", label: "One special character (e.g. ! @ # $ % & *)", test: (p: string) => SPECIAL_CHAR.test(p) },
] as const;

export function validateNewPassword(password: string): string | undefined {
  if (!password) return "Create a password.";
  if (password.length > PASSWORD_MAX_LENGTH)
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  const unmet = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
  if (unmet.length > 0) return "Password does not meet all of the requirements below.";
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (!confirm) return "Confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return undefined;
}

export type LoginFields = "email" | "password";
export type RegisterFields = "email" | "password" | "confirmPassword";
export type ResetFields = "password" | "confirmPassword";

export function validateLogin(values: Record<LoginFields, string>): FieldErrors<LoginFields> {
  return compact({
    email: validateEmail(values.email),
    password: validateLoginPassword(values.password),
  });
}

export function validateRegistration(
  values: Record<RegisterFields, string>,
): FieldErrors<RegisterFields> {
  return compact({
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
  });
}

export function validatePasswordReset(values: Record<ResetFields, string>): FieldErrors<ResetFields> {
  return compact({
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
  });
}

function compact<T extends string>(errors: Record<T, string | undefined>): FieldErrors<T> {
  const out: FieldErrors<T> = {};
  for (const key in errors) if (errors[key]) out[key] = errors[key];
  return out;
}

/**
 * Only allow same-site relative redirect targets (e.g. "/home"), to prevent
 * open redirects via ?next=https://evil.example.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
