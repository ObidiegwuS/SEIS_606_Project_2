import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameBoard, type BoardPuzzle } from "@/components/GameBoard";

const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const puzzles: BoardPuzzle[] = [
  { id: "movie-001", emojis: "🦁👑", hint: "A lion prince.", solved: false },
  { id: "movie-002", emojis: "🚢🧊💔", hint: "An ocean liner.", solved: false },
];

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
}

beforeEach(() => router.refresh.mockReset());

describe("GameBoard", () => {
  it("shows the emoji clue, a labelled answer box, and a hidden hint", async () => {
    render(<GameBoard categoryName="Movies" puzzles={puzzles} />);
    expect(screen.getByTestId("emoji-clue")).toHaveTextContent("🦁👑");
    expect(screen.getByText("Puzzle 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("A lion prince.")).not.toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /show hint/i }));
    expect(screen.getByText("A lion prince.")).toBeVisible();
  });

  it("rejects a blank answer without calling the server", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<GameBoard categoryName="Movies" puzzles={puzzles} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Submit Answer" }));
    expect(screen.getByText("Enter an answer before submitting.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows an incorrect message", async () => {
    mockFetch(200, { result: "incorrect", pointsAwarded: 0, score: 0 });
    render(<GameBoard categoryName="Movies" puzzles={puzzles} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "Bambi");
    await userEvent.click(screen.getByRole("button", { name: "Submit Answer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not quite — try again. No points awarded.");
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("marks a correct answer solved, shows points, and refreshes the score", async () => {
    const fetchSpy = mockFetch(200, { result: "correct", pointsAwarded: 10, answer: "The Lion King", score: 10 });
    render(<GameBoard categoryName="Movies" puzzles={puzzles} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "lion king");
    await userEvent.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)).toEqual({ puzzleId: "movie-001", answer: "lion king" });
    expect(await screen.findByRole("status")).toHaveTextContent("Correct! +10 points. The answer is The Lion King.");
    expect(screen.getByText("✓ Solved")).toBeInTheDocument();
    expect(screen.queryByLabelText("Your answer")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 solved")).toBeInTheDocument();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("navigates between puzzles and starts at the first unsolved one", async () => {
    render(
      <GameBoard
        categoryName="Movies"
        puzzles={[{ ...puzzles[0], solved: true, answer: "The Lion King" }, puzzles[1]]}
      />,
    );
    expect(screen.getByText("Puzzle 2 of 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "← Previous" }));
    expect(screen.getByText("Puzzle 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("The Lion King")).toBeInTheDocument();
  });

  it("celebrates when every puzzle is solved", () => {
    render(<GameBoard categoryName="Movies" puzzles={puzzles.map((p) => ({ ...p, solved: true, answer: "x" }))} />);
    expect(screen.getByRole("status")).toHaveTextContent("You've solved every Movies puzzle!");
    expect(screen.getByRole("link", { name: "Back to categories" })).toHaveAttribute("href", "/home");
  });

  it("asks the user to log in again if the session ended", async () => {
    mockFetch(401, { error: "unauthenticated" });
    render(<GameBoard categoryName="Movies" puzzles={puzzles} />);
    await userEvent.type(screen.getByLabelText("Your answer"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Submit Answer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your session has ended.");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });
});
