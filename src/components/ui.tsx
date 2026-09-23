import type { ReactNode } from 'react';

/** Shared presentational primitives, so panels stay visually consistent. */

export const Card = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] ${className}`}
  >
    {(title || actions) && (
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-5 py-4">
        <div className="min-w-0">
          {title && (
            <h2 className="text-sm font-semibold tracking-wide text-[var(--color-ink)]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className="px-5 py-4">{children}</div>
  </section>
);

export const Stat = ({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'a' | 'b' | 'neutral';
}) => {
  const color =
    accent === 'a'
      ? 'text-[var(--color-side-a)]'
      : accent === 'b'
        ? 'text-[var(--color-side-b)]'
        : 'text-[var(--color-ink)]';

  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
        {label}
      </dt>
      <dd className={`tabular mt-1 truncate text-lg font-semibold ${color}`}>{value}</dd>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">{hint}</p>}
    </div>
  );
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[#06121f] hover:brightness-110 disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-ink-muted)]',
  secondary:
    'border border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
  ghost:
    'border border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
  danger:
    'border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-[#1a0505]',
};

export const Button = ({
  children,
  onClick,
  disabled,
  variant = 'secondary',
  type = 'button',
  className = '',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  className?: string;
  title?: string;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${VARIANTS[variant]} ${className}`}
  >
    {children}
  </button>
);

type Tone = 'neutral' | 'a' | 'b' | 'success' | 'danger' | 'pending';

const TONES: Record<Tone, string> = {
  neutral: 'border-[var(--color-border-strong)] text-[var(--color-ink-muted)]',
  a: 'border-[var(--color-side-a)] text-[var(--color-side-a)]',
  b: 'border-[var(--color-side-b)] text-[var(--color-side-b)]',
  success: 'border-[var(--color-success)] text-[var(--color-success)]',
  danger: 'border-[var(--color-danger)] text-[var(--color-danger)]',
  pending: 'border-[var(--color-accent)] text-[var(--color-accent)]',
};

export const Chip = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${TONES[tone]}`}
  >
    {children}
  </span>
);

/** A labelled field wrapper matching the input styling below. */
export const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
      {label}
    </span>
    <div className="mt-1.5">{children}</div>
    {hint && <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">{hint}</p>}
  </label>
);

export const inputClass =
  'tabular w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent)] disabled:opacity-60';

/** Inline notice used for errors and warnings inside panels. */
export const Notice = ({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'danger' | 'warning';
  children: ReactNode;
}) => {
  const styles =
    tone === 'danger'
      ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 text-[var(--color-danger)]'
      : tone === 'warning'
        ? 'border-[var(--color-side-b)]/40 bg-[var(--color-side-b)]/5 text-[var(--color-side-b)]'
        : 'border-[var(--color-border-subtle)] text-[var(--color-ink-muted)]';

  return (
    <p className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${styles}`}>
      {children}
    </p>
  );
};
