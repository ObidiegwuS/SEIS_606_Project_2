"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RESET_LINK_ERRORS, resetPassword } from "@/lib/auth/client";
import { validatePasswordReset } from "@/lib/validation";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { PasswordRequirements } from "./PasswordRequirements";
import { TextField } from "./TextField";
import { useAuthForm } from "./useAuthForm";
import styles from "./AuthForm.module.css";

const REQUIREMENTS_ID = "reset-password-requirements";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { formRef, field, values, formError, formErrorCode, submitting, onSubmit } = useAuthForm({
    initialValues: { password: "", confirmPassword: "" },
    validate: validatePasswordReset,
    submit: ({ password }) => resetPassword(token, password),
    onSuccess: () => router.push("/login?reset=1"),
  });

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-label="Reset password">
      {formError && (
        <FormAlert tone="error">
          {formError}
          {formErrorCode && RESET_LINK_ERRORS.includes(formErrorCode) && (
            <>
              {" "}
              <Link href="/forgot-password">Request a new link</Link>
            </>
          )}
        </FormAlert>
      )}
      <TextField
        label="New Password"
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
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        required
        revealable
        {...field("confirmPassword")}
      />
      <Button type="submit" fullWidth loading={submitting} loadingText="Saving…">
        Reset Password
      </Button>
    </form>
  );
}
