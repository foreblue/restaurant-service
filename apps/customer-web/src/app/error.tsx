"use client";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { StateBlock } from "@/components/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <ReservationPageShell
      description="문제가 반복되면 예약 링크를 보낸 매장에 문의해 주세요."
      eyebrow="오류"
      title="예약 페이지를 불러오지 못했습니다."
    >
      <StateBlock
        action={{ label: "다시 시도", onClick: reset }}
        title="잠시 후 다시 시도해 주세요."
        variant="error"
      >
        <p>{error.digest ?? error.message}</p>
      </StateBlock>
    </ReservationPageShell>
  );
}
