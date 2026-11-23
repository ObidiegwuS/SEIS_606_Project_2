import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { ResendVerificationForm } from "@/components/ResendVerificationForm";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function mockFetch(status: number, body: unknown = {}) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
}

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
});

describe("LoginForm", () => {
  it("blocks blank submission and focuses the first invalid field", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows an error and does not navigate when credentials are rejected", async () => {
    mockFetch(401, { message: "Incorrect email or password." });
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email"), "player@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("treats a server error as a failure, not a login", async () => {
    mockFetch(501, { error: "not_implemented" });
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email"), "player@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "emoji4ever");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/not available/i);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sends a normalized email and navigates on success", async () => {
    const fetchSpy = mockFetch(200);
    render(<LoginForm redirectTo="/home" />);
    await userEvent.type(screen.getByLabelText("Email"), "  Player@Example.com ");
    await userEvent.type(screen.getByLabelText("Password"), "emoji4ever");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body).toEqual({ email: "player@example.com", password: "emoji4ever" });
    expect(router.replace).toHaveBeenCalledWith("/home");
  });

  it("blocks unverified accounts and offers to resend the verification email", async () => {
    mockFetch(403, { error: "email_not_verified", message: "Please verify your email address before logging in." });
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email"), "player@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Emoji#2026");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/verify your email/i);
    expect(screen.getByRole("link", { name: /resend verification email/i })).toHaveAttribute(
      "href",
      "/verify-email/resend",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does not offer a resend link for wrong passwords", async () => {
    mockFetch(401);
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email"), "player@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Wrong#2026");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    await screen.findByRole("alert");
    expect(screen.queryByRole("link", { name: /resend/i })).not.toBeInTheDocument();
  });

  it("links to forgot password", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  });

  it("shows the lockout message with a reset-password link", async () => {
    mockFetch(423, {
      error: "account_locked",
      message: "This account is locked for 24 hours after 3 failed login attempts.",
    });
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email"), "player@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Wrong#2026");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/locked for 24 hours/i);
    const links = screen.getAllByRole("link", { name: /reset your password/i });
    expect(links[0]).toHaveAttribute("href", "/forgot-password");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("can toggle password visibility", async () => {
    render(<LoginForm />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
  });
});

describe("RegisterForm", () => {
  async function fill(email: string, password: string, confirm: string) {
    if (email) await userEvent.type(screen.getByLabelText("Email Address"), email);
    if (password) await userEvent.type(screen.getByLabelText("Password"), password);
    if (confirm) await userEvent.type(screen.getByLabelText("Confirm Password"), confirm);
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));
  }

  it("shows the password requirements before any input and ticks them off live", async () => {
    render(<RegisterForm />);
    const list = screen.getByRole("list", { name: /password must include/i });
    expect(list.querySelectorAll('[data-met="true"]')).toHaveLength(0);
    expect(screen.getByText(/at least 7 characters/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Password"), "Abcdef!");
    expect(list.querySelectorAll('[data-met="true"]')).toHaveLength(4);
  });

  it("blocks a weak password without calling the server", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<RegisterForm />);
    await fill("player@example.com", "abcdefg1", "abcdefg1");

    expect(screen.getByText(/does not meet all of the requirements/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the server", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<RegisterForm />);
    await fill("player@example.com", "Emoji#2026", "Emoji#2025");

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects an invalid email format", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<RegisterForm />);
    await fill("player@example", "Emoji#2026", "Emoji#2026");

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("disables the button while submitting and sends only email + password", async () => {
    let resolve!: (r: Response) => void;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(<RegisterForm />);
    await fill("player@example.com", "Emoji#2026", "Emoji#2026");

    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body).toEqual({ email: "player@example.com", password: "Emoji#2026" });

    resolve(new Response("{}", { status: 201 }));
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/register/check-email"));
  });

  it("shows the duplicate-email error next to the email field (AT-02)", async () => {
    mockFetch(409, {
      message: "An account with this email already exists.",
      fieldErrors: { email: "This email is already registered." },
    });
    render(<RegisterForm />);
    await fill("player@example.com", "Emoji#2026", "Emoji#2026");

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    expect(screen.getByText("This email is already registered.")).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("links back to the login page", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("link", { name: /back to log in/i })).toHaveAttribute("href", "/login");
  });
});

describe("ResendVerificationForm", () => {
  it("validates the email before sending", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ResendVerificationForm />);
    await userEvent.click(screen.getByRole("button", { name: "Resend Verification Email" }));
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the normalized email and shows a confirmation", async () => {
    const fetchSpy = mockFetch(200);
    render(<ResendVerificationForm />);
    await userEvent.type(screen.getByLabelText("Email Address"), " Player@Example.com");
    await userEvent.click(screen.getByRole("button", { name: "Resend Verification Email" }));

    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/resend-verification", expect.anything());
    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)).toEqual({ email: "player@example.com" });
    expect(await screen.findByRole("status")).toHaveTextContent(/sent a new link/i);
  });

  it("shows an error if sending fails", async () => {
    mockFetch(503, { message: "We couldn't send the verification email. Please try again." });
    render(<ResendVerificationForm />);
    await userEvent.type(screen.getByLabelText("Email Address"), "player@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Resend Verification Email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't send/i);
  });
});

describe("ForgotPasswordForm", () => {
  it("posts the email and shows a neutral confirmation", async () => {
    const fetchSpy = mockFetch(200);
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email Address"), "Player@Example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/forgot-password", expect.anything());
    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)).toEqual({ email: "player@example.com" });
    expect(await screen.findByRole("status")).toHaveTextContent(/if an account exists/i);
  });
});

describe("ResetPasswordForm", () => {
  it("shows requirements and rejects weak or mismatched passwords locally", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ResetPasswordForm token="tok" />);
    expect(screen.getByRole("list", { name: /password must include/i })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("New Password"), "weakpass");
    await userEvent.type(screen.getByLabelText("Confirm New Password"), "weakpas");
    await userEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(screen.getByText(/does not meet all of the requirements/i)).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the token and new password, then goes to login", async () => {
    const fetchSpy = mockFetch(200);
    render(<ResetPasswordForm token="tok123" />);
    await userEvent.type(screen.getByLabelText("New Password"), "NewPass!1");
    await userEvent.type(screen.getByLabelText("Confirm New Password"), "NewPass!1");
    await userEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)).toEqual({ token: "tok123", password: "NewPass!1" });
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/login?reset=1"));
  });

  it("offers a new link when the token has expired", async () => {
    mockFetch(400, { error: "expired_token", message: "This password reset link has expired." });
    render(<ResetPasswordForm token="old" />);
    await userEvent.type(screen.getByLabelText("New Password"), "NewPass!1");
    await userEvent.type(screen.getByLabelText("Confirm New Password"), "NewPass!1");
    await userEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/expired/i);
    expect(screen.getByRole("link", { name: /request a new link/i })).toHaveAttribute("href", "/forgot-password");
  });
});
