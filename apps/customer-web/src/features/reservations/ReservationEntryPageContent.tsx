"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { Alert, Button, Field, Input, StateBlock } from "@/components/ui";

export function ReservationEntryPageContent() {
  const router = useRouter();
  const [reservationPath, setReservationPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetPath = toReservationPagePath(reservationPath);

    if (!targetPath) {
      setError("매장에서 공유한 예약 링크나 예약 페이지 코드를 입력해 주세요.");
      return;
    }

    setError(null);
    router.push(targetPath);
  }

  return (
    <ReservationPageShell
      description="매장에서 공유한 예약 링크나 예약 페이지 코드로 예약을 시작합니다."
      eyebrow="예약 신청"
      title="예약 페이지 찾기"
    >
      <div className="grid gap-4">
        <form
          className="grid gap-4 rounded-lg border bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <Field
            error={error ?? undefined}
            htmlFor="reservation-page-code"
            label="예약 링크 또는 코드"
          >
            <Input
              id="reservation-page-code"
              placeholder="예: /r/cheongdam-main 또는 cheongdam-main"
              value={reservationPath}
              onChange={(event) => {
                setError(null);
                setReservationPath(event.target.value);
              }}
            />
          </Field>
          <Button type="submit">예약 화면 열기</Button>
        </form>

        <StateBlock title="예약번호가 이미 있나요?">
          <p>예약 조회에서 예약번호와 휴대폰 번호로 기존 예약을 확인할 수 있습니다.</p>
          <Link
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            href="/reservations"
          >
            예약 조회
          </Link>
        </StateBlock>

        <Alert>
          공개되지 않은 예약 페이지는 열리지 않습니다. 링크가 맞는데도 예약 화면이 보이지 않으면
          매장에 공개 상태를 확인해 주세요.
        </Alert>
      </div>
    </ReservationPageShell>
  );
}

function toReservationPagePath(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    return toReservationPagePath(`${url.pathname}${url.search}`);
  } catch {
    // Plain codes are expected; URLs are handled above.
  }

  const path = normalized.replace(/^\/+/, "");

  if (!path) {
    return null;
  }

  if (path.startsWith("r/") || path.startsWith("reserve/")) {
    return `/${path}`;
  }

  if (/^\d+$/.test(path)) {
    return `/reserve/${path}`;
  }

  return `/r/${encodeURIComponent(path)}`;
}
