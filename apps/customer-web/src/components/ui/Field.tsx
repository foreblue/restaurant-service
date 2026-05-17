import { type ReactNode } from "react";

interface FieldProps {
  children: ReactNode;
  error?: string | undefined;
  hint?: string | undefined;
  htmlFor: string;
  label: string;
  required?: boolean | undefined;
}

export function Field({ children, error, hint, htmlFor, label, required = false }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-slate-800" htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="text-xs leading-5 text-slate-500" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs leading-5 text-red-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function getFieldDescriptionIds(fieldId: string, hasHint?: boolean, hasError?: boolean) {
  const ids = [hasHint ? `${fieldId}-hint` : null, hasError ? `${fieldId}-error` : null].filter(
    Boolean,
  );

  return ids.length > 0 ? ids.join(" ") : undefined;
}
