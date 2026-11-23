"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth/client";
import { validateRegistration } from "@/lib/validation";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { PasswordRequirements } from "./PasswordRequirements";
import { TextField } from "./TextField";
import { useAuthForm } from "./useAuthForm";
import styles from "./AuthForm.module.css";

const REQUIREMENTS_ID = "password-requirements";

export function RegisterForm() {
  const router = useRouter();
  const { formRef, field, values, formError, submitting, onSubmit } = useAuthForm({
    initialValues: { email: "", password: "", confirmPassword: "" },
    validate: validateRegistration,
    submit: ({ email, password }) => register({ email, password }),
    onSuccess: () => router.push("/register/check-email"),
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
        label="Email Address"
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
        required
        revealable
        describedById={REQUIREMENTS_ID}
        {...field("password")}
      >
        <PasswordRequirements id={REQUIREMENTS_ID} password={values.password} />
      </TextField>
      <TextField
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        required
        revealable
        {...field("confirmPassword")}
      />
      <Button type="submit" fullWidth loading={submitting} loadingText="Creating account…">
        Create Account
      </Button>
      <p className={styles.alt}>
        Already have an account? <Link href="/login">Back to log in</Link>
      </p>
    </form>
  );
}
