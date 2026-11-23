import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { ButtonLink } from "@/components/Button";
import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <main id="main" className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heading}>
            <Logo size="lg" asLink={false} />
          </h1>
          <p className={styles.tagline}>Guess the movie or country from emoji clues.</p>
          <p className={styles.sample} aria-hidden="true">
            🍁 🏒 🫎 = ?
          </p>
        </header>

        <div className={styles.grid}>
          <AuthCard
            eyebrow="New player"
            title="Create a new account"
            titleId="new-player-title"
            description="Sign up to save your score and pick up where you left off."
            emphasis="highlight"
          >
            <ul className={styles.perks}>
              <li><span aria-hidden="true">🎬</span> Movie and country puzzles</li>
              <li><span aria-hidden="true">⭐</span> Earn points for correct answers</li>
              <li><span aria-hidden="true">💾</span> Your progress is saved</li>
            </ul>
            <div className={styles.pushDown}>
              <ButtonLink href="/register" fullWidth>
                Create a New Account
              </ButtonLink>
            </div>
          </AuthCard>

          <AuthCard
            eyebrow="Returning player"
            title="Log in"
            titleId="returning-player-title"
            description="Welcome back! Log in to keep playing."
          >
            <LoginForm />
          </AuthCard>
        </div>

        <p className={styles.switch}>
          Prefer a full page? <Link href="/login">Log in</Link> or{" "}
          <Link href="/register">create an account</Link>.
        </p>
      </main>
    </div>
  );
}
