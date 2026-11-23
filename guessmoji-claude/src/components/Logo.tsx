import Link from "next/link";
import styles from "./Logo.module.css";

type LogoProps = { size?: "md" | "lg"; asLink?: boolean };

export function Logo({ size = "md", asLink = true }: LogoProps) {
  const content = (
    <>
      <span className={styles.mark} aria-hidden="true">🎬🌍</span>
      <span className={styles.word}>
        Guess<span className={styles.accent}>Moji</span>
      </span>
    </>
  );
  const className = `${styles.logo} ${size === "lg" ? styles.lg : ""}`;
  return asLink ? (
    <Link href="/" className={className} aria-label="GuessMoji home">
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}
