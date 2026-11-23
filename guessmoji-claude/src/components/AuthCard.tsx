import type { ReactNode } from "react";
import styles from "./AuthCard.module.css";

type AuthCardProps = {
  eyebrow?: string;
  title: string;
  titleId?: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  emphasis?: "default" | "highlight";
};

export function AuthCard({
  eyebrow,
  title,
  titleId,
  description,
  children,
  footer,
  emphasis = "default",
}: AuthCardProps) {
  return (
    <section
      className={`${styles.card} ${emphasis === "highlight" ? styles.highlight : ""}`}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}
