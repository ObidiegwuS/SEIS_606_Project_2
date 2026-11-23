"use client";

import { useState, type ReactNode } from "react";
import type { AuthResult } from "@/lib/auth/client";
import { validateEmail } from "@/lib/validation";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { TextField } from "./TextField";
import { useAuthForm } from "./useAuthForm";
import styles from "./AuthForm.module.css";

type Props = {
  /** Accessible name for the form. */
  label: string;
  submitLabel: string;
  submittingLabel: string;
  successMessage: ReactNode;
  submit: (email: string) => Promise<AuthResult<"email">>;
};

/** A single email field that requests something by email (resend verification, reset password). */
export function EmailRequestForm({ label, submitLabel, submittingLabel, successMessage, submit }: Props) {
  const [sent, setSent] = useState(false);
  const { formRef, field, formError, submitting, onSubmit } = useAuthForm({
    initialValues: { email: "" },
    validate: ({ email }) => {
      const error = validateEmail(email);
      return error ? { email: error } : {};
    },
    submit: ({ email }) => submit(email),
    onSuccess: () => setSent(true),
  });

  if (sent) return <FormAlert tone="success">{successMessage}</FormAlert>;

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-label={label}>
      {formError && <FormAlert tone="error">{formError}</FormAlert>}
      <TextField
        label="Email Address"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
        {...field("email")}
      />
      <Button type="submit" fullWidth loading={submitting} loadingText={submittingLabel}>
        {submitLabel}
      </Button>
    </form>
  );
}
