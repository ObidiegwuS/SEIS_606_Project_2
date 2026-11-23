import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "./Button";
import { Logo } from "./Logo";
import styles from "./AppHeader.module.css";

type Props = {
  email: string;
  score: number;
  /** Shows a "← Categories" link (on game screens). */
  showBack?: boolean;
};

/** Top bar for logged-in screens: logo, optional back link, score, email, and Log Out. */
export function AppHeader({ email, score, showBack }: Props) {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.logo}>
          <Logo />
        </span>
        {showBack && (
          <Link href="/home" className={styles.back}>
            <span aria-hidden="true">←</span> Categories
          </Link>
        )}
      </div>
      <div className={styles.right}>
        <span className={styles.score} aria-label={`Total score: ${score} points`}>
          ⭐ <span data-testid="total-score">{score}</span> pts
        </span>
        <span className={styles.email} title={email}>
          {email}
        </span>
        <form action={logoutAction} className={styles.logout}>
          <Button type="submit" variant="secondary">
            Log Out
          </Button>
        </form>
      </div>
    </header>
  );
}
