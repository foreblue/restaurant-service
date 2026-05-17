import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:8080"),
  NEXT_PUBLIC_APP_BASE_URL: z.url().default("http://localhost:3000"),
});

export interface CustomerWebEnv {
  apiBaseUrl: string;
  appBaseUrl: string;
}

export function getCustomerWebEnv(source: NodeJS.ProcessEnv): CustomerWebEnv {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error("사용자 FE 환경 변수가 올바르지 않습니다.");
  }

  return {
    apiBaseUrl: parsed.data.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, ""),
    appBaseUrl: parsed.data.NEXT_PUBLIC_APP_BASE_URL.replace(/\/+$/, ""),
  };
}

export const customerWebEnv = getCustomerWebEnv(process.env);
