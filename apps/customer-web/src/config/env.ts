import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:8080"),
  NEXT_PUBLIC_APP_BASE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT: z.url().optional(),
  NEXT_PUBLIC_RELEASE: z.string().trim().min(1).default("local"),
});

type CustomerWebEnvSource = Partial<{
  NEXT_PUBLIC_API_BASE_URL: string | undefined;
  NEXT_PUBLIC_APP_BASE_URL: string | undefined;
  NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT: string | undefined;
  NEXT_PUBLIC_RELEASE: string | undefined;
}>;

export interface CustomerWebEnv {
  apiBaseUrl: string;
  appBaseUrl: string;
  errorReportingEndpoint: string | null;
  release: string;
}

export function getCustomerWebEnv(source: CustomerWebEnvSource): CustomerWebEnv {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error("사용자 FE 환경 변수가 올바르지 않습니다.");
  }

  return {
    apiBaseUrl: parsed.data.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, ""),
    appBaseUrl: parsed.data.NEXT_PUBLIC_APP_BASE_URL.replace(/\/+$/, ""),
    errorReportingEndpoint:
      parsed.data.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT?.replace(/\/+$/, "") ?? null,
    release: parsed.data.NEXT_PUBLIC_RELEASE,
  };
}

export const customerWebEnv = getCustomerWebEnv({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
  NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
  NEXT_PUBLIC_RELEASE: process.env.NEXT_PUBLIC_RELEASE,
});
