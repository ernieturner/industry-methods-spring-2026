import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[28px] border border-[color:var(--card-border)] bg-[var(--card-bg)] p-6 pb-8",
        "shadow-[var(--card-shadow)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}



export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight leading-tight text-[var(--app-text)]">
      {children}
    </h2>
  );
}

export function CardDesc({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{children}</p>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
      : "border border-[color:var(--card-border)] bg-[var(--card-bg)] text-[var(--app-text)] hover:bg-black/5 dark:hover:bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]";
  const text = "text-[var(--app-text)]";
  return (
    <button
      className={[base, styles, variant === "secondary" ? text : "", className].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={[
        "appearance-none box-border w-full rounded-xl border-0 bg-transparent px-6 py-3 text-base shadow-none outline-0 text-[var(--app-text)]",
        "placeholder:text-[color:var(--muted)]",
        "focus:outline-0 focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:outline-0",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}



export function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--card-border)] bg-[var(--chip-bg)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--chip-text)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      {children}
    </span>
  );
}
