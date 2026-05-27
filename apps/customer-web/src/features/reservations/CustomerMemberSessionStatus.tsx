"use client";

import Link from "next/link";

import { type PublicMember } from "./publicMemberTypes";
import { useCustomerMemberSession } from "./useCustomerMemberSession";

type CustomerMemberSessionStatusVariant = "card" | "entry" | "header";

interface CustomerMemberSessionStatusProps {
  redirectTo?: string | undefined;
  variant: CustomerMemberSessionStatusVariant;
}

export function CustomerMemberSessionStatus({
  redirectTo = "/reserve",
  variant,
}: CustomerMemberSessionStatusProps) {
  const { clearSession, loading, member } = useCustomerMemberSession();

  if (variant === "header") {
    return (
      <HeaderSessionStatus
        loading={loading}
        member={member}
        redirectTo={redirectTo}
        onLogout={clearSession}
      />
    );
  }

  if (variant === "entry") {
    return (
      <EntrySessionStatus
        loading={loading}
        member={member}
        redirectTo={redirectTo}
        onLogout={clearSession}
      />
    );
  }

  return (
    <CardSessionStatus
      loading={loading}
      member={member}
      redirectTo={redirectTo}
      onLogout={clearSession}
    />
  );
}

function HeaderSessionStatus({
  loading,
  member,
  onLogout,
  redirectTo,
}: {
  loading: boolean;
  member: PublicMember | null;
  onLogout: () => void;
  redirectTo: string;
}) {
  if (loading) {
    return (
      <span className="inline-flex min-h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500">
        로그인 확인 중
      </span>
    );
  }

  if (!member) {
    return (
      <div className="flex shrink-0 gap-2">
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-md bg-[#03c75a] px-3 text-xs font-bold text-white transition hover:bg-[#02b451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] focus-visible:ring-offset-2"
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        >
          로그인
        </Link>
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] focus-visible:ring-offset-2"
          href="/reservations"
        >
          예약 조회
        </Link>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <span className="inline-flex min-h-9 items-center rounded-md bg-emerald-50 px-3 text-xs font-bold text-emerald-800">
        {member.name}님
      </span>
      <Link
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] focus-visible:ring-offset-2"
        href="/reservations"
      >
        내 예약
      </Link>
      <Link
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] focus-visible:ring-offset-2"
        href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        onClick={onLogout}
      >
        계정 전환
      </Link>
      <button
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] focus-visible:ring-offset-2"
        type="button"
        onClick={onLogout}
      >
        로그아웃
      </button>
    </div>
  );
}

function CardSessionStatus({
  loading,
  member,
  onLogout,
  redirectTo,
}: {
  loading: boolean;
  member: PublicMember | null;
  onLogout: () => void;
  redirectTo: string;
}) {
  if (loading) {
    return (
      <section className="grid gap-3 rounded-lg border bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">로그인 상태 확인 중</h2>
        <p className="text-sm leading-6 text-slate-600">저장된 사용자 정보를 확인하고 있습니다.</p>
      </section>
    );
  }

  if (!member) {
    return (
      <section className="grid gap-3 rounded-lg border bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">사용자 로그인</h2>
        <p className="text-sm leading-6 text-slate-600">
          테스트 회원 ID만 입력하면 예약에 사용할 사용자 정보가 자동 연결됩니다.
        </p>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-800 focus-visible:ring-offset-2"
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        >
          사용자 로그인
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{member.name}님으로 로그인됨</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          회원 #{member.id} · 연락처 끝자리 {member.phoneLast4}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-800 focus-visible:ring-offset-2"
          href="/reservations"
        >
          내 예약
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
          onClick={onLogout}
        >
          계정 전환
        </Link>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          type="button"
          onClick={onLogout}
        >
          로그아웃
        </button>
      </div>
    </section>
  );
}

function EntrySessionStatus({
  loading,
  member,
  onLogout,
  redirectTo,
}: {
  loading: boolean;
  member: PublicMember | null;
  onLogout: () => void;
  redirectTo: string;
}) {
  if (loading) {
    return (
      <section className="grid gap-2 rounded-lg border bg-white p-5 text-sm text-slate-600 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">로그인 정보를 확인하는 중입니다.</h2>
        <p>저장된 회원 정보를 확인하고 있습니다.</p>
      </section>
    );
  }

  if (!member) {
    return (
      <section className="grid gap-2 rounded-lg border bg-white p-5 text-sm text-slate-600 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">사용자 로그인이 필요합니다.</h2>
        <p>회원 ID만 입력하면 예약에 사용할 사용자 정보가 자동 연결됩니다.</p>
        <Link
          className="mt-1 inline-flex min-h-10 items-center justify-center rounded-md bg-teal-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-800 focus-visible:ring-offset-2"
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        >
          사용자 로그인
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-slate-700 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{member.name}님, 예약을 시작하세요</h2>
      <p>회원 #{member.id} 정보가 연결되어 있습니다. 매장을 선택하면 이 회원으로 예약됩니다.</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          href="/reservations"
        >
          내 예약
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
          onClick={onLogout}
        >
          계정 전환
        </Link>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          type="button"
          onClick={onLogout}
        >
          로그아웃
        </button>
      </div>
    </section>
  );
}
