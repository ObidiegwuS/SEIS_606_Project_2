"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { isBlankAnswer, MAX_ANSWER_LENGTH } from "@/lib/game/answers";
import { POINTS_PER_PUZZLE } from "@/lib/game/categories";
import { checkAnswer } from "@/lib/game/client";
import { Button, ButtonLink } from "./Button";
import { FormAlert } from "./FormAlert";
import { TextField } from "./TextField";
import styles from "./GameBoard.module.css";

export type BoardPuzzle = { id: string; emojis: string; hint: string; solved: boolean; answer?: string };

type Feedback =
  | { tone: "success"; text: string }
  | { tone: "error"; text: string; loginLink?: boolean }
  | null;

type Props = { categoryName: string; puzzles: BoardPuzzle[] };

export function GameBoard({ categoryName, puzzles: initial }: Props) {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState(initial);
  const [index, setIndex] = useState(() => Math.max(0, initial.findIndex((p) => !p.solved)));
  const [answer, setAnswer] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const hintId = useId();

  const puzzle = puzzles[index];
  const solvedCount = puzzles.filter((p) => p.solved).length;
  const allSolved = puzzles.length > 0 && solvedCount === puzzles.length;
  const isLast = index === puzzles.length - 1;

  function goTo(next: number) {
    setIndex(next);
    setAnswer("");
    setFieldError(undefined);
    setFeedback(null);
    setHintOpen(false);
  }

  // Put the cursor in the answer box whenever a new unsolved puzzle is shown.
  useEffect(() => {
    if (puzzle && !puzzle.solved) inputRef.current?.focus({ preventScroll: true });
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !puzzle) return;
    setFeedback(null);
    if (isBlankAnswer(answer)) {
      setFieldError("Enter an answer before submitting.");
      inputRef.current?.focus();
      return;
    }
    setFieldError(undefined);
    setSubmitting(true);
    const res = await checkAnswer(puzzle.id, answer);
    setSubmitting(false);

    if (!res.ok) {
      setFeedback({ tone: "error", text: res.message, loginLink: res.status === 401 });
      return;
    }
    if (res.result === "incorrect") {
      setFeedback({ tone: "error", text: "Not quite — try again. No points awarded." });
      inputRef.current?.select();
      return;
    }

    setPuzzles((prev) => prev.map((p) => (p.id === puzzle.id ? { ...p, solved: true, answer: res.answer } : p)));
    setFeedback({
      tone: "success",
      text:
        res.result === "correct"
          ? `Correct! +${res.pointsAwarded} points. The answer is ${res.answer}.`
          : `Correct — you already solved this one, so no extra points. The answer is ${res.answer}.`,
    });
    router.refresh(); // updates the score in the header from the server
    requestAnimationFrame(() => nextRef.current?.focus());
  }

  if (!puzzle) {
    return <FormAlert tone="error">No puzzles are available in this category yet.</FormAlert>;
  }

  return (
    <section className={styles.board} aria-label={`${categoryName} puzzles`}>
      <div className={styles.meta}>
        <p className={styles.counter}>
          Puzzle {index + 1} of {puzzles.length}
        </p>
        <p className={styles.solvedCount}>
          {solvedCount} of {puzzles.length} solved
        </p>
      </div>

      {allSolved && (
        <div className={styles.complete} role="status">
          <p className={styles.completeTitle}>🎉 You&apos;ve solved every {categoryName} puzzle!</p>
          <ButtonLink href="/home" variant="secondary">
            Back to categories
          </ButtonLink>
        </div>
      )}

      <div className={styles.card}>
        <p className={styles.clueLabel} id="clue-label">
          Emoji clue
        </p>
        <p className={styles.emojis} aria-labelledby="clue-label" data-testid="emoji-clue">
          {puzzle.emojis}
        </p>

        {puzzle.solved ? (
          <p className={styles.solved}>
            <span className={styles.badge}>✓ Solved</span> The answer is <strong>{puzzle.answer}</strong>.
          </p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Submit your answer">
            <TextField
              ref={inputRef}
              label="Your answer"
              name="answer"
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              maxLength={MAX_ANSWER_LENGTH}
              value={answer}
              error={fieldError}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (fieldError) setFieldError(undefined);
              }}
            />
            <Button type="submit" fullWidth loading={submitting} loadingText="Checking…">
              Submit Answer
            </Button>
          </form>
        )}

        {feedback && (
          <FormAlert tone={feedback.tone}>
            {feedback.text}
            {feedback.tone === "error" && feedback.loginLink && (
              <>
                {" "}
                <Link href="/login">Log in</Link>
              </>
            )}
          </FormAlert>
        )}

        <div className={styles.hintBox}>
          <button
            type="button"
            className={styles.hintToggle}
            aria-expanded={hintOpen}
            aria-controls={hintId}
            onClick={() => setHintOpen((o) => !o)}
          >
            {hintOpen ? "Hide hint" : "💡 Show hint"}
          </button>
          <p id={hintId} className={styles.hint} hidden={!hintOpen}>
            {puzzle.hint}
          </p>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Puzzle navigation">
        <Button variant="secondary" onClick={() => goTo(index - 1)} disabled={index === 0}>
          ← Previous
        </Button>
        <Button
          ref={nextRef}
          variant={puzzle.solved && !isLast ? "primary" : "secondary"}
          onClick={() => goTo(index + 1)}
          disabled={isLast}
        >
          {puzzle.solved ? "Next puzzle →" : "Skip →"}
        </Button>
      </nav>
      <p className={styles.points}>Each new puzzle you solve earns {POINTS_PER_PUZZLE} points.</p>
    </section>
  );
}
