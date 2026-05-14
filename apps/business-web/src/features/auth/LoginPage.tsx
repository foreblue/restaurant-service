import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, UtensilsCrossed } from "lucide-react";

import { useCurrentUserQuery, useLoginMutation } from "@/features/auth/authQueries";

interface RouteState {
  from?: Location;
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as RouteState | null;
  const returnTo = routeState?.from?.pathname ?? "/";
  const currentUser = useCurrentUserQuery();
  const login = useLoginMutation();
  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("password123");

  if (currentUser.isSuccess) {
    return <Navigate to={returnTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login.mutateAsync({ email, password });
      navigate(returnTo, { replace: true });
    } catch {
      // Mutation state renders the field-level error.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-[420px] rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <UtensilsCrossed aria-hidden className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">사업자 로그인</h1>
            <p className="text-sm text-muted-foreground">예약 운영 콘솔</p>
          </div>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="business-email">
              이메일
            </label>
            <input
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              id="business-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="business-password">
              비밀번호
            </label>
            <input
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              id="business-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {login.isError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {login.error.message}
            </p>
          ) : null}

          <button
            className="mt-1 flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={login.isPending}
          >
            <KeyRound aria-hidden className="size-4" />
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
