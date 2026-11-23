import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary";

function classes(variant: Variant, fullWidth?: boolean) {
  return [styles.button, styles[variant], fullWidth ? styles.full : ""].join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", fullWidth, loading, loadingText, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes(variant, fullWidth)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (loadingText ?? children) : children}
    </button>
  );
});

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
};

export function ButtonLink({ href, variant = "primary", fullWidth, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={classes(variant, fullWidth)}>
      {children}
    </Link>
  );
}
