/** Browser-side call for checking an answer. The server decides correctness and points. */
export type AnswerResponse =
  | { ok: true; result: "correct" | "already_solved"; pointsAwarded: number; answer: string; score: number }
  | { ok: true; result: "incorrect"; pointsAwarded: 0; score: number }
  | { ok: false; status: number; message: string };

export async function checkAnswer(puzzleId: string, answer: string): Promise<AnswerResponse> {
  let res: Response;
  try {
    res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ puzzleId, answer }),
    });
  } catch {
    return { ok: false, status: 0, message: "Could not reach the server. Check your connection and try again." };
  }
  let payload: Record<string, unknown> = {};
  try {
    payload = await res.json();
  } catch {
    /* non-JSON */
  }
  if (res.ok) return { ok: true, ...(payload as object) } as AnswerResponse;
  if (res.status === 401) {
    return { ok: false, status: 401, message: "Your session has ended. Please log in again." };
  }
  return {
    ok: false,
    status: res.status,
    message: typeof payload.message === "string" ? payload.message : "Something went wrong. Please try again.",
  };
}
