"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type SubmitHandler, useForm } from "react-hook-form";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { Alert, Button, Field, getFieldDescriptionIds, Input } from "@/components/ui";
import { PublicApiError, toCustomerApiErrorMessage } from "@/shared/api/apiError";
import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import { issueReservationLookupToken } from "./reservationLookupApi";
import {
  reservationLookupSchema,
  type ReservationLookupFormInput,
  type ReservationLookupFormValues,
} from "./reservationLookupSchema";

export function ReservationLookupPageContent() {
  return (
    <ReservationPageShell
      description="예약번호와 예약 시 입력한 휴대폰 번호로 예약 상세를 다시 확인할 수 있습니다."
      eyebrow="예약 확인"
      title="예약 조회"
    >
      <ReservationLookupForm />
    </ReservationPageShell>
  );
}

function ReservationLookupForm() {
  const apiClient = usePublicApiClient();
  const router = useRouter();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ReservationLookupFormInput, unknown, ReservationLookupFormValues>({
    defaultValues: {
      phoneNumber: "",
      reservationNumber: "",
    },
    resolver: zodResolver(reservationLookupSchema),
    shouldFocusError: true,
  });

  const lookupMutation = useMutation({
    mutationFn: (values: ReservationLookupFormValues) =>
      issueReservationLookupToken(values, apiClient),
    onSuccess: (response) => {
      router.push(
        `/reservations/${response.reservationId}?token=${encodeURIComponent(response.lookupToken)}`,
      );
    },
  });
  const submitting = isSubmitting || lookupMutation.isPending;
  const onSubmit: SubmitHandler<ReservationLookupFormValues> = (values) =>
    lookupMutation.mutate(values);

  return (
    <form
      className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <h2 className="text-base font-semibold text-slate-950">예약 정보 입력</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          예약 완료 화면이나 알림에 표시된 예약번호를 입력해 주세요.
        </p>
      </div>

      <Field
        error={errors.reservationNumber?.message}
        htmlFor="reservation-lookup-number"
        label="예약번호"
        required
      >
        <Input
          autoComplete="off"
          id="reservation-lookup-number"
          invalid={Boolean(errors.reservationNumber)}
          placeholder="RSV-20260518-0001"
          {...register("reservationNumber")}
          aria-describedby={getFieldDescriptionIds(
            "reservation-lookup-number",
            false,
            Boolean(errors.reservationNumber),
          )}
        />
      </Field>

      <Field
        error={errors.phoneNumber?.message}
        htmlFor="reservation-lookup-phone"
        label="휴대폰 번호"
        required
      >
        <Input
          autoComplete="tel"
          id="reservation-lookup-phone"
          inputMode="tel"
          invalid={Boolean(errors.phoneNumber)}
          placeholder="01012345678"
          type="tel"
          {...register("phoneNumber")}
          aria-describedby={getFieldDescriptionIds(
            "reservation-lookup-phone",
            false,
            Boolean(errors.phoneNumber),
          )}
        />
      </Field>

      {lookupMutation.isError ? (
        <Alert title="예약을 조회하지 못했습니다." variant="error">
          {toReservationLookupErrorMessage(lookupMutation.error)}
        </Alert>
      ) : null}

      <Button disabled={submitting} type="submit">
        {submitting ? "조회 중" : "예약 조회"}
      </Button>
    </form>
  );
}

function toReservationLookupErrorMessage(error: unknown) {
  if (error instanceof PublicApiError) {
    if (error.status === 403) {
      return "예약번호와 휴대폰 번호가 일치하지 않습니다.";
    }

    if (error.status === 404) {
      return "입력한 예약번호의 예약을 찾을 수 없습니다.";
    }

    if (error.status === 400) {
      return "예약번호와 휴대폰 번호를 다시 확인해 주세요.";
    }
  }

  return toCustomerApiErrorMessage(error);
}
