import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ButtonLink } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORIES, CATEGORY_SLUGS } from "@/lib/game/categories";
import { getProgress } from "@/server/progress";
import styles from "./home.module.css";

export const metadata: Metadata = { title: "Choose a category" };

// Never cache: the result depends on the requester's session.
export const dynamic = "force-dynamic";

/** Category selection — the first screen after logging in. */
export default async function HomePage() {
  // Server-side check on every request: valid session AND verified email.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fhome");

  const progress = getProgress(user.id);

  return (
    <div className={styles.shell}>
      <AppHeader email={user.email} score={progress.score} />

      <main id="main" className={styles.main}>
        <section className={styles.intro} aria-labelledby="choose-title">
          <p className={styles.welcome}>
            Welcome, <strong>{user.email}</strong>!
          </p>
          <h1 id="choose-title" className={styles.title}>
            Choose a category
          </h1>
          <p className={styles.subtitle}>Solve emoji puzzles to earn points. Your progress is saved automatically.</p>
        </section>

        <ul className={styles.grid} aria-label="Game categories">
          {CATEGORY_SLUGS.map((slug) => {
            const category = CATEGORIES[slug];
            const { solved, total } = progress.categories[slug];
            return (
              <li key={slug}>
                <article className={`${styles.card} ${styles[slug]}`} aria-labelledby={`${slug}-title`}>
                  <p className={styles.visual} role="img" aria-label={category.visualLabel}>
                    {category.visual}
                  </p>
                  <h2 id={`${slug}-title`} className={styles.cardTitle}>
                    {category.name}
                  </h2>
                  <p className={styles.description}>{category.description}</p>
                  <div className={styles.progress}>
                    <div
                      className={styles.bar}
                      role="progressbar"
                      aria-label={`${category.name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-valuenow={solved}
                    >
                      <span style={{ width: `${total ? (solved / total) * 100 : 0}%` }} />
                    </div>
                    <p className={styles.progressText}>
                      {solved} of {total} solved
                    </p>
                  </div>
                  <ButtonLink href={`/play/${slug}`} fullWidth>
                    {category.playLabel}
                  </ButtonLink>
                </article>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
