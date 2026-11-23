"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  /** Adds a show/hide toggle for password inputs. */
  revealable?: boolean;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, name, error, hint, type = "text", revealable, ...rest },
  ref,
) {
  const id = `${name}-${useId()}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const [revealed, setRevealed] = useState(false);
  const inputType = revealable && revealed ? "text" : type;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <div className={styles.control}>
        <input
          ref={ref}
          id={id}
          name={name}
          type={inputType}
          className={`${styles.input} ${error ? styles.invalid : ""} ${revealable ? styles.withToggle : ""}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...rest}
        />
        {revealable && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setRevealed((r) => !r)}
            aria-pressed={revealed}
            aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
});
