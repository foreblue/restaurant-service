import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Alert, Button, Field, fieldA11y, Input } from "@/components/ui";
import { AuthFrame } from "@/features/auth/AuthFrame";
import { usePasswordResetRequestMutation } from "@/features/auth/authQueries";
import {
  type PasswordResetRequestFormValues,
  passwordResetRequestSchema,
} from "@/features/auth/authSchemas";

export function PasswordResetRequestPage() {
  const passwordReset = usePasswordResetRequestMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<PasswordResetRequestFormValues>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(passwordResetRequestSchema),
  });

  async function handleRequest(values: PasswordResetRequestFormValues) {
    try {
      await passwordReset.mutateAsync(values);
    } catch {
      // Mutation state renders the submit error.
    }
  }

  return (
    <AuthFrame title="비밀번호 재설정" subtitle="계정 이메일로 재설정 요청">
      <form className="grid gap-4" onSubmit={handleSubmit(handleRequest)}>
        <Field id="reset-email" label="이메일" error={errors.email?.message}>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            {...fieldA11y("reset-email", { error: errors.email?.message })}
            {...register("email")}
          />
        </Field>

        {passwordReset.isSuccess ? (
          <Alert variant="success">비밀번호 재설정 요청이 접수되었습니다.</Alert>
        ) : null}
        {passwordReset.isError ? (
          <Alert variant="danger">{passwordReset.error.message}</Alert>
        ) : null}

        <Button type="submit" isLoading={passwordReset.isPending}>
          <MailCheck aria-hidden className="size-4" />
          재설정 요청
        </Button>
      </form>

      <div className="mt-4 flex justify-end">
        <Link className="text-sm font-medium text-primary hover:underline" to="/login">
          로그인
        </Link>
      </div>
    </AuthFrame>
  );
}
