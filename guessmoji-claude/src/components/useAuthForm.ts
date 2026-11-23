"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import type { AuthResult } from "@/lib/auth/client";
import type { FieldErrors } from "@/lib/validation";

type Options<F extends string> = {
  initialValues: Record<F, string>;
  validate: (values: Record<F, string>) => FieldErrors<F>;
  submit: (values: Record<F, string>) => Promise<AuthResult<F>>;
  onSuccess: () => void;
};

/**
 * Shared state and behaviour for the auth forms:
 * - validates each field on blur, and live once the user has tried to submit
 * - blocks submission while invalid and moves focus to the first invalid field
 * - shows server errors without ever treating a failed request as success
 */
export function useAuthForm<F extends string>({ initialValues, validate, submit, onSuccess }: Options<F>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<F>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (focusTick === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const name = e.target.name as F;
    const next = { ...values, [name]: e.target.value };
    setValues(next);
    if (attempted || errors[name]) setErrors(validate(next));
  }

  function onBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name as F;
    if (!values[name]) return; // don't nag about empty fields before a submit attempt
    const fieldError = validate(values)[name];
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setAttempted(true);
    setFormError(null);
    setFormErrorCode(undefined);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFocusTick((t) => t + 1);
      return;
    }

    setSubmitting(true);
    const result = await submit(values);
    if (result.ok) {
      onSuccess();
      return; // keep the button disabled while navigating away
    }
    setSubmitting(false);
    setFormError(result.message);
    setFormErrorCode(result.code);
    if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
      setErrors(result.fieldErrors);
      setFocusTick((t) => t + 1);
    }
  }

  const field = (name: F) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange,
    onBlur,
  });

  return { formRef, field, values, formError, formErrorCode, submitting, onSubmit };
}
