"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";

import {
  Alert,
  Button,
  Checkbox,
  Field,
  getFieldDescriptionIds,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

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

const requestTemplateOptions = [
  "조용한 좌석 선호",
  "아이 동반",
  "고령자 동반",
  "기념일 방문",
  "빠른 서빙 요청",
] as const;

const anniversaryTypeOptions = [
  { label: "선택 안 함", value: "" },
  { label: "생일", value: "BIRTHDAY" },
  { label: "결혼기념일", value: "WEDDING_ANNIVERSARY" },
  { label: "기타 기념일", value: "OTHER" },
] as const;

const privacyConsentDescription =
  "예약 확인과 매장 응대를 위해 이름, 연락처, 선택 입력 정보를 수집합니다.";
const marketingConsentDescription = "수신 동의는 선택이며, 동의하지 않아도 예약할 수 있습니다.";

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
      allergyNote: "",
      anniversaryDate: "",
      anniversaryType: "",
      marketingConsent: false,
      phoneNumber: "",
      privacyConsent: false,
      requestNotes: "",
      requestTemplateValues: [],
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

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">선택 정보</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            매장 응대에 필요한 내용만 선택적으로 입력해 주세요.
          </p>
        </div>

        <Alert title="민감 정보 입력 안내" variant="warning">
          알레르기 등 건강 관련 정보는 예약 응대 목적에 필요한 범위로만 입력해 주세요.
        </Alert>

        <Field
          error={errors.allergyNote?.message}
          hint="예: 갑각류, 견과류, 유제품"
          htmlFor="reservation-allergy-note"
          label="알레르기"
        >
          <Textarea
            id="reservation-allergy-note"
            invalid={Boolean(errors.allergyNote)}
            maxLength={1000}
            placeholder="매장에 미리 알려야 할 알레르기가 있다면 입력해 주세요."
            {...register("allergyNote")}
            aria-describedby={getFieldDescriptionIds(
              "reservation-allergy-note",
              true,
              Boolean(errors.allergyNote),
            )}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            error={errors.anniversaryType?.message}
            htmlFor="reservation-anniversary-type"
            label="기념일"
          >
            <Select
              id="reservation-anniversary-type"
              invalid={Boolean(errors.anniversaryType)}
              {...register("anniversaryType")}
              aria-describedby={getFieldDescriptionIds(
                "reservation-anniversary-type",
                false,
                Boolean(errors.anniversaryType),
              )}
            >
              {anniversaryTypeOptions.map((option) => (
                <option key={option.value || "none"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            error={errors.anniversaryDate?.message}
            hint="연도 없이 MM-DD 형식도 가능합니다."
            htmlFor="reservation-anniversary-date"
            label="기념일 날짜"
          >
            <Input
              id="reservation-anniversary-date"
              invalid={Boolean(errors.anniversaryDate)}
              placeholder="05-17"
              {...register("anniversaryDate")}
              aria-describedby={getFieldDescriptionIds(
                "reservation-anniversary-date",
                true,
                Boolean(errors.anniversaryDate),
              )}
            />
          </Field>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-slate-800">요청사항 템플릿</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {requestTemplateOptions.map((option, index) => (
              <Checkbox
                id={`reservation-template-${index}`}
                key={option}
                label={option}
                value={option}
                {...register("requestTemplateValues")}
              />
            ))}
          </div>
          {errors.requestTemplateValues?.message ? (
            <p className="text-xs leading-5 text-red-700">{errors.requestTemplateValues.message}</p>
          ) : null}
        </fieldset>
      </section>

      <div className="grid gap-3">
        <Checkbox
          description={privacyConsentDescription}
          error={errors.privacyConsent?.message}
          id="reservation-privacy-consent"
          label="개인정보 수집에 동의합니다."
          {...register("privacyConsent")}
        />
        <Checkbox
          description={marketingConsentDescription}
          id="reservation-marketing-consent"
          label="마케팅 정보 수신에 동의합니다. (선택)"
          {...register("marketingConsent")}
        />
      </div>

      <Button disabled={isSubmitting || submitting} type="submit">
        {submitting ? "예약 생성 중" : submitLabel}
      </Button>
    </form>
  );
}
