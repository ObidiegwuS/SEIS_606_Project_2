import { NextResponse, type NextRequest } from "next/server";
import { MAX_ANSWER_LENGTH } from "@/lib/game/answers";
import { submitAnswer } from "@/server/progress";
import { requireUser } from "@/server/requireUser";

const noStore = { "Cache-Control": "no-store" };

/** Check an answer for the logged-in player. Points are recorded on the server only. */
export async function POST(request: NextRequest) {
  const auth = requireUser(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400, headers: noStore });
  }

  const outcome = submitAnswer(auth.id, body);
  switch (outcome.status) {
    case "blank":
      return NextResponse.json(
        { message: "Enter an answer before submitting.", fieldErrors: { answer: "Enter an answer before submitting." } },
        { status: 400, headers: noStore },
      );
    case "too_long":
      return NextResponse.json(
        { message: `Answers must be ${MAX_ANSWER_LENGTH} characters or fewer.` },
        { status: 400, headers: noStore },
      );
    case "unknown_puzzle":
      return NextResponse.json({ message: "That puzzle doesn't exist." }, { status: 404, headers: noStore });
    case "incorrect":
      return NextResponse.json({ result: "incorrect", pointsAwarded: 0, score: outcome.score }, { headers: noStore });
    case "correct":
      return NextResponse.json(
        {
          result: outcome.alreadySolved ? "already_solved" : "correct",
          pointsAwarded: outcome.pointsAwarded,
          answer: outcome.answer,
          score: outcome.score,
        },
        { headers: noStore },
      );
  }
}
