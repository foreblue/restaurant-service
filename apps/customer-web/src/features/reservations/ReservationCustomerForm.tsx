"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";

import { Button, Checkbox, Field, getFieldDescriptionIds, Input, Textarea } from "@/components/ui";

import {
  reservationCustomerSchema,
  type ReservationCustomerFormInput,
  type ReservationCustomerFormValues,
} from "./reservationCustomerSchema";

interface ReservationCustomerFormProps {
  onSubmit: SubmitHandler<ReservationCustomerFormValues>;
  submitLabel?: string | undefined;
  submitting?: boolean | undefined;
}

export function ReservationCustomerForm({
  onSubmit,
  submitLabel = "입력 정보 확인",
  submitting = false,
}: ReservationCustomerFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ReservationCustomerFormInput, unknown, ReservationCustomerFormValues>({
    defaultValues: {
      customerName: "",
      email: "",
      marketingConsent: false,
      phoneNumber: "",
      privacyConsent: false,
      requestNotes: "",
    },
    resolver: zodResolver(reservationCustomerSchema),
    shouldFocusError: true,
  });

  return (
    <form
      className="grid gap-4 rounded-lg border bg-slate-50 p-4"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <h3 className="text-base font-semibold text-slate-950">고객 정보</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          예약 확인에 필요한 정보를 입력해 주세요.
        </p>
      </div>

      <Field
        error={errors.customerName?.message}
        htmlFor="reservation-customer-name"
        label="이름"
        required
      >
        <Input
          autoComplete="name"
          id="reservation-customer-name"
          invalid={Boolean(errors.customerName)}
          {...register("customerName")}
          aria-describedby={getFieldDescriptionIds(
            "reservation-customer-name",
            false,
            Boolean(errors.customerName),
          )}
        />
      </Field>

      <Field
        error={errors.phoneNumber?.message}
        htmlFor="reservation-phone-number"
        label="휴대폰 번호"
        required
      >
        <Input
          autoComplete="tel"
          id="reservation-phone-number"
          inputMode="tel"
          invalid={Boolean(errors.phoneNumber)}
          placeholder="01012345678"
          type="tel"
          {...register("phoneNumber")}
          aria-describedby={getFieldDescriptionIds(
            "reservation-phone-number",
            false,
            Boolean(errors.phoneNumber),
          )}
        />
      </Field>

      <Field error={errors.email?.message} htmlFor="reservation-email" label="이메일">
        <Input
          autoComplete="email"
          id="reservation-email"
          inputMode="email"
          invalid={Boolean(errors.email)}
          placeholder="name@example.com"
          type="email"
          {...register("email")}
          aria-describedby={getFieldDescriptionIds(
            "reservation-email",
            false,
            Boolean(errors.email),
          )}
        />
      </Field>

      <Field
        error={errors.requestNotes?.message}
        htmlFor="reservation-request-notes"
        label="요청사항"
      >
        <Textarea
          id="reservation-request-notes"
          invalid={Boolean(errors.requestNotes)}
          maxLength={500}
          placeholder="좌석, 알레르기, 방문 목적 등 매장에 전달할 내용을 입력해 주세요."
          {...register("requestNotes")}
          aria-describedby={getFieldDescriptionIds(
            "reservation-request-notes",
            false,
            Boolean(errors.requestNotes),
          )}
        />
      </Field>

      <div className="grid gap-3">
        <Checkbox
          error={errors.privacyConsent?.message}
          id="reservation-privacy-consent"
          label="개인정보 수집에 동의합니다."
          {...register("privacyConsent")}
        />
        <Checkbox
          id="reservation-marketing-consent"
          label="마케팅 정보 수신에 동의합니다."
          {...register("marketingConsent")}
        />
      </div>

      <Button disabled={isSubmitting || submitting} type="submit">
        {submitting ? "예약 생성 중" : submitLabel}
      </Button>
    </form>
  );
}
