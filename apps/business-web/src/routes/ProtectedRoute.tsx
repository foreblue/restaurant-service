import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useCurrentUserQuery } from "@/features/auth/authQueries";
import { UnauthorizedApiError } from "@/shared/api/businessApiClient";

export function ProtectedRoute() {
  const location = useLocation();
  const currentUser = useCurrentUserQuery();

  if (currentUser.isPending) {
    return <FullPageStatus title="세션 확인 중" />;
  }

  if (currentUser.error instanceof UnauthorizedApiError) {
    return <Navigate to="/login" replace state={{ from: location, reason: "auth-required" }} />;
  }

  if (currentUser.isError) {
    return <FullPageStatus title="연결 오류" description={currentUser.error.message} />;
  }

  return <Outlet />;
}

function FullPageStatus({ title, description }: { title: string; description?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="w-full max-w-[360px] rounded-lg border border-border bg-card p-5 text-center shadow-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </section>
    </main>
  );
}
