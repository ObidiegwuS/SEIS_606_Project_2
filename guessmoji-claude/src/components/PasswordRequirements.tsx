import { PASSWORD_REQUIREMENTS } from "@/lib/validation";
import styles from "./PasswordRequirements.module.css";

type Props = { id: string; password: string };

/** Live checklist of password rules, visible before the user submits. */
export function PasswordRequirements({ id, password }: Props) {
  return (
    <div className={styles.box}>
      <p id={`${id}-title`} className={styles.title}>
        Password must include:
      </p>
      <ul id={id} className={styles.list} aria-labelledby={`${id}-title`}>
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.id} className={met ? styles.met : styles.unmet} data-met={met}>
              <span className={styles.icon} aria-hidden="true">
                {met ? "✓" : "○"}
              </span>
              {req.label}
              <span className={styles.srOnly}>{met ? " (met)" : " (not met)"}</span>
            </li>
          );
        })}
      </ul>
      <p className={styles.note}>Numbers are allowed but not required.</p>
    </div>
  );
}
