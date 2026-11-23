"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACCOUNT_LOCKED, EMAIL_NOT_VERIFIED, login } from "@/lib/auth/client";
import { safeRedirectPath, validateLogin } from "@/lib/validation";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { TextField } from "./TextField";
import { useAuthForm } from "./useAuthForm";
import styles from "./AuthForm.module.css";

type LoginFormProps = {
  /** Where to go after a successful login. Must be a relative path. */
  redirectTo?: string;
  /** Message shown above the form, e.g. after registering. */
  notice?: string;
};

export function LoginForm({ redirectTo, notice }: LoginFormProps) {
  const router = useRouter();
  const { formRef, field, formError, formErrorCode, submitting, onSubmit } = useAuthForm({
    initialValues: { email: "", password: "" },
    validate: validateLogin,
    submit: login,
    onSuccess: () => {
      router.replace(safeRedirectPath(redirectTo));
      router.refresh();
    },
  });

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-label="Log in">
      {notice && !formError && <FormAlert tone="success">{notice}</FormAlert>}
      {formError && (
        <FormAlert tone="error">
          {formError}
          {formErrorCode === EMAIL_NOT_VERIFIED && (
            <>
              {" "}
              <Link href="/verify-email/resend">Resend verification email</Link>
            </>
          )}
          {formErrorCode === ACCOUNT_LOCKED && (
            <>
              {" "}
              <Link href="/forgot-password">Reset your password</Link>
            </>
          )}
        </FormAlert>
      )}
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
        autoComplete="current-password"
        required
        revealable
        {...field("password")}
      />
      <p className={styles.forgot}>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
      <Button type="submit" fullWidth loading={submitting} loadingText="Logging in…">
        Log In
      </Button>
    </form>
  );
}
