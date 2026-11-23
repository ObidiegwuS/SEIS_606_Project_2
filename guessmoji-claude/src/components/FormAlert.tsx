import type { ReactNode } from "react";
import styles from "./FormAlert.module.css";

type FormAlertProps = { tone: "error" | "success"; children: ReactNode };

/** Form-level message. Errors use role="alert" so screen readers announce them immediately. */
export function FormAlert({ tone, children }: FormAlertProps) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
