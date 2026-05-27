"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { Alert, Button, Field, Input, StateBlock } from "@/components/ui";
import { PublicApiError, toCustomerApiErrorMessage } from "@/shared/api/apiError";
import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import {
  clearStoredCustomerMemberId,
  readStoredCustomerMemberId,
  storeCustomerMemberId,
} from "./customerMemberSession";
import { getPublicMemberById, getPublicMembers } from "./publicMemberApi";
import { type PublicMember } from "./publicMemberTypes";

interface CustomerLoginPageContentProps {
  redirectTo?: string | undefined;
}

export function CustomerLoginPageContent({
  redirectTo = "/reserve",
}: CustomerLoginPageContentProps) {
  const apiClient = usePublicApiClient();
  const [memberId, setMemberId] = useState("");
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [loggedInMember, setLoggedInMember] = useState<PublicMember | null>(null);
  const membersQuery = useQuery({
    queryFn: () => getPublicMembers(apiClient),
    queryKey: ["public-members"],
  });
  const loginMutation = useMutation({
    mutationFn: async () => {
      const parsedMemberId = Number(memberId.trim());
      if (!Number.isSafeInteger(parsedMemberId) || parsedMemberId < 1) {
        throw new Error("회원 ID는 숫자로 입력해 주세요.");
      }

      return getPublicMemberById(parsedMemberId, apiClient);
    },
    onSuccess: (member) => {
      storeCustomerMemberId(member.id);
      setLoggedInMember(member);
      setSwitchingAccount(false);
    },
  });

  useEffect(() => {
    const storedMemberId = readStoredCustomerMemberId();
    if (!storedMemberId) {
      return;
    }

    setMemberId(String(storedMemberId));
    void getPublicMemberById(storedMemberId, apiClient)
      .then((member) => {
        setLoggedInMember(member);
        setSwitchingAccount(false);
      })
      .catch(() => {
        clearStoredCustomerMemberId();
        setLoggedInMember(null);
      });
  }, [apiClient]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate();
  }

  return (
    <ReservationPageShell
      description="테스트 회원 ID만 입력하면 사용자 로그인 상태로 예약을 진행할 수 있습니다."
      eyebrow="사용자 로그인"
      title="사용자 로그인"
    >
      <div className="grid gap-4">
        {loggedInMember && !switchingAccount ? (
          <StateBlock title="로그인 완료" variant="empty">
            <p>
              {loggedInMember.name} 회원으로 로그인했습니다. 연락처 끝자리{" "}
              {loggedInMember.phoneLast4}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-800 focus-visible:ring-offset-2"
                href={redirectTo}
              >
                예약 계속하기
              </Link>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                type="button"
                onClick={() => {
                  setMemberId("");
                  setSwitchingAccount(true);
                  loginMutation.reset();
                }}
              >
                계정 전환
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                type="button"
                onClick={() => {
                  clearStoredCustomerMemberId();
                  setLoggedInMember(null);
                  setMemberId("");
                  setSwitchingAccount(false);
                  loginMutation.reset();
                }}
              >
                로그아웃
              </button>
            </div>
          </StateBlock>
        ) : null}

        {!loggedInMember || switchingAccount ? (
          <form
            className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm"
            noValidate
            onSubmit={handleSubmit}
          >
            <Field htmlFor="customer-member-id" label="회원 ID" required>
              <Input
                autoComplete="username"
                id="customer-member-id"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="예: 1"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              />
            </Field>

            {loginMutation.isError ? (
              <Alert title="로그인하지 못했습니다." variant="error">
                {loginErrorMessage(loginMutation.error)}
              </Alert>
            ) : null}

            <Button disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? "로그인 중" : "로그인"}
            </Button>
          </form>
        ) : null}

        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">테스트 회원 ID</h2>
          {membersQuery.isLoading ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">회원 목록을 불러오는 중입니다.</p>
          ) : membersQuery.isError ? (
            <p className="mt-3 text-sm leading-6 text-red-700">회원 목록을 불러오지 못했습니다.</p>
          ) : (
            <div className="mt-3 divide-y rounded-md border">
              {(membersQuery.data?.members ?? []).map((member) => (
                <div className="grid gap-1 px-3 py-3 text-sm" key={member.id}>
                  <p className="font-semibold text-slate-950">
                    ID {member.id} · {member.name}
                  </p>
                  <p className="break-words text-xs leading-5 text-slate-500">
                    연락처 끝자리 {member.phoneLast4} · {member.email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ReservationPageShell>
  );
}

function loginErrorMessage(error: unknown) {
  if (error instanceof PublicApiError) {
    return toCustomerApiErrorMessage(error);
  }

  return error instanceof Error ? error.message : "회원 ID를 확인해 주세요.";
}
