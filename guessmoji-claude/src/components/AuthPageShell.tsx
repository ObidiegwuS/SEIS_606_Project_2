import type { ReactNode } from "react";
import { Logo } from "./Logo";
import styles from "./AuthPageShell.module.css";

/** Layout for single-purpose auth pages (/login, /register). */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Logo />
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
