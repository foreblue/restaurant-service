import { type Metadata } from "next";

import { CustomerLoginPageContent } from "@/features/reservations/CustomerLoginPageContent";

interface CustomerLoginPageProps {
  searchParams: Promise<{
    redirect?: string | string[] | undefined;
  }>;
}

export const metadata: Metadata = {
  title: "사용자 로그인",
  description: "회원 ID만 입력해 사용자 예약 로그인을 진행합니다.",
};

export default async function CustomerLoginPage({ searchParams }: CustomerLoginPageProps) {
  const search = await searchParams;

  return <CustomerLoginPageContent redirectTo={safeRedirect(firstQueryValue(search.redirect))} />;
}

function firstQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return value?.trim() || null;
}

function safeRedirect(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/reserve";
  }

  return value;
}
