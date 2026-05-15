import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { Alert, Button, Field, fieldA11y, Input } from "@/components/ui";
import { AuthFrame } from "@/features/auth/AuthFrame";
import { useCurrentUserQuery, useLoginMutation } from "@/features/auth/authQueries";
import { type LoginFormValues, loginSchema } from "@/features/auth/authSchemas";
import { UnauthorizedApiError } from "@/shared/api/businessApiClient";

interface RouteState {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
  reason?: "auth-required";
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as RouteState | null;
  const returnTo = toReturnPath(routeState);
  const currentUser = useCurrentUserQuery();
  const login = useLoginMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  if (currentUser.isSuccess) {
    return <Navigate to={returnTo} replace />;
  }

  async function handleLogin(values: LoginFormValues) {
    try {
      await login.mutateAsync(values);
      navigate(returnTo, { replace: true });
    } catch {
      // Mutation state renders the submit error.
    }
  }

  return (
    <AuthFrame title="사업자 로그인" subtitle="예약 운영 콘솔">
      {routeState?.reason === "auth-required" ? (
        <Alert variant="info">로그인이 필요하거나 세션이 만료되었습니다.</Alert>
      ) : null}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(handleLogin)}>
        <Field id="business-email" label="이메일" error={errors.email?.message}>
          <Input
            id="business-email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            {...fieldA11y("business-email", { error: errors.email?.message })}
            {...register("email")}
          />
        </Field>

        <Field id="business-password" label="비밀번호" error={errors.password?.message}>
          <Input
            id="business-password"
            type="password"
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
            {...fieldA11y("business-password", { error: errors.password?.message })}
            {...register("password")}
          />
        </Field>

        {login.isError ? <Alert variant="danger">{loginErrorMessage(login.error)}</Alert> : null}

        <Button className="mt-1" type="submit" isLoading={login.isPending}>
          <KeyRound aria-hidden className="size-4" />
          로그인
        </Button>
      </form>

      <div className="mt-4 flex justify-end">
        <Link className="text-sm font-medium text-primary hover:underline" to="/password-reset">
          비밀번호 재설정
        </Link>
      </div>
    </AuthFrame>
  );
}

function toReturnPath(routeState: RouteState | null) {
  const from = routeState?.from;

  if (!from?.pathname || from.pathname === "/login" || from.pathname === "/password-reset") {
    return "/";
  }

  return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
}

function loginErrorMessage(error: Error) {
  if (error instanceof UnauthorizedApiError) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  return error.message;
}
