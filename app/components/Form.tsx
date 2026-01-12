'use client';

import { ReactNode } from 'react';

// Shared style constants
const inputStyles = 'w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400';
const labelStyles = 'block font-medium';
const hintStyles = 'text-sm text-zinc-500';

// Form field wrapper with label and optional hint
export function FormField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className={labelStyles}>
        {label}
      </label>
      {children}
      {hint && <p className={hintStyles}>{hint}</p>}
    </div>
  );
}

// Styled select dropdown
export function FormSelect<T extends string | number>({
  id,
  value,
  onChange,
  options,
  className,
}: {
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className={`${inputStyles} ${className ?? ''}`}
    >
      {options.map(opt => (
        <option key={String(opt.value)} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Styled text input
export function FormInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  id?: string;
  type?: 'text' | 'number';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${inputStyles} ${className ?? ''}`}
    />
  );
}

// Toggle button group for selecting between options
export function ToggleButtonGroup<T extends string | boolean>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const activeStyles = 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white';
  const inactiveStyles = 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400';

  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            value === opt.value ? activeStyles : inactiveStyles
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
