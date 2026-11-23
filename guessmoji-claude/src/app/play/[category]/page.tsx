import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { GameBoard } from "@/components/GameBoard";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORIES, isCategory } from "@/lib/game/categories";
import { getClientPuzzles, getProgress } from "@/server/progress";
import styles from "./play.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return { title: isCategory(category) ? CATEGORIES[category].name : "Game" };
}

export default async function PlayPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/play/${category}`)}`);

  const meta = CATEGORIES[category];
  const progress = getProgress(user.id);

  return (
    <div className={styles.shell}>
      <AppHeader email={user.email} score={progress.score} showBack />
      <main id="main" className={styles.main}>
        <header className={styles.heading}>
          <p className={styles.visual} aria-hidden="true">
            {meta.visual}
          </p>
          <h1 className={styles.title}>{meta.name}</h1>
          <p className={styles.description}>{meta.description}</p>
        </header>
        <GameBoard categoryName={meta.name} puzzles={getClientPuzzles(user.id, category)} />
      </main>
    </div>
  );
}
