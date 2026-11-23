"use client";

import { useRouter } from "next/navigation";
import { register } from "@/lib/auth/client";
import { PASSWORD_MIN_LENGTH, validateRegistration } from "@/lib/validation";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { TextField } from "./TextField";
import { useAuthForm } from "./useAuthForm";
import styles from "./AuthForm.module.css";

export function RegisterForm() {
  const router = useRouter();
  const { formRef, field, formError, submitting, onSubmit } = useAuthForm({
    initialValues: { email: "", password: "", confirmPassword: "" },
    validate: validateRegistration,
    submit: ({ email, password }) => register({ email, password }),
    onSuccess: () => router.push("/login?registered=1"),
  });

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={onSubmit}
      noValidate
      aria-label="Create a new account"
    >
      {formError && <FormAlert tone="error">{formError}</FormAlert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
        {...field("email")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`}
        required
        revealable
        {...field("password")}
      />
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        revealable
        {...field("confirmPassword")}
      />
      <Button type="submit" fullWidth loading={submitting} loadingText="Creating account…">
        Create Account
      </Button>
    </form>
  );
}
