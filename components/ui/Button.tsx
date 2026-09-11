import Link from "next/link";
import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "gold" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-body font-semibold tracking-[0.02em] transition-colors disabled:cursor-not-allowed disabled:opacity-55";

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 text-[12.5px]",
  md: "min-h-11 px-5 text-[13.5px]",
  lg: "min-h-12 px-7 text-[14px]",
};

const variants: Record<Variant, string> = {
  primary: "bg-carbon text-marfil hover:bg-carbon-700",
  gold: "bg-oro text-carbon hover:bg-[#c39f2c]",
  outline: "border border-carbon/25 text-carbon hover:border-carbon hover:bg-carbon/[0.04]",
  ghost: "text-carbon hover:bg-carbon/[0.06]",
  danger: "bg-error-fg text-white hover:bg-[#a72e4c]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };
type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children" | "href"> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    loading,
    className,
    children,
    ...rest
  } = props;

  const cls = clsx(
    base,
    sizes[size],
    variants[variant],
    fullWidth && "w-full",
    className,
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={cls} {...linkRest}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as ButtonAsButton;
  return (
    <button
      className={cls}
      aria-busy={loading || undefined}
      disabled={loading || buttonRest.disabled}
      {...buttonRest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
