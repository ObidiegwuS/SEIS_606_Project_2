import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

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
    mockFetch(401, { message: "invalid" });
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email"), "player@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("treats a not-implemented backend as a failure, not a login", async () => {
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
    await userEvent.type(screen.getByLabelText("Email"), email);
    await userEvent.type(screen.getByLabelText("Password"), password);
    await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));
  }

  it("rejects mismatched passwords without calling the server", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<RegisterForm />);
    await fill("player@example.com", "emoji4ever", "emoji4evr");

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not send the confirmation field to the server", async () => {
    const fetchSpy = mockFetch(201);
    render(<RegisterForm />);
    await fill("player@example.com", "emoji4ever", "emoji4ever");

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body).toEqual({ email: "player@example.com", password: "emoji4ever" });
    expect(router.push).toHaveBeenCalledWith("/login?registered=1");
  });

  it("reports a duplicate email (AT-02)", async () => {
    mockFetch(409);
    render(<RegisterForm />);
    await fill("player@example.com", "emoji4ever", "emoji4ever");

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    expect(router.push).not.toHaveBeenCalled();
  });
});
