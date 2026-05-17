"use client";

import { useEffect } from "react";

import { reportClientError } from "./customerErrorReporting";

export function ClientErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      void reportClientError(event.error ?? event.message, {
        column: event.colno,
        filename: event.filename,
        line: event.lineno,
        source: "window.error",
      });
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      void reportClientError(event.reason, { source: "window.unhandledrejection" });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
