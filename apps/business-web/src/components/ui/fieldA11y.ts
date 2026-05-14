interface FieldA11yOptions {
  error?: string | undefined;
  hasDescription?: boolean | undefined;
}

export function fieldA11y(id: string, options: FieldA11yOptions = {}) {
  const describedBy = [
    options.hasDescription ? `${id}-description` : null,
    options.error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    "aria-describedby": describedBy || undefined,
    "aria-invalid": Boolean(options.error),
  };
}
