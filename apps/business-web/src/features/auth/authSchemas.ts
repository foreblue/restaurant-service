import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("올바른 이메일을 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const passwordResetRequestSchema = z.object({
  email: z.email("올바른 이메일을 입력해 주세요."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordResetRequestFormValues = z.infer<typeof passwordResetRequestSchema>;
