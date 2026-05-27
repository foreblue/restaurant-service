"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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

import { type PublicMember } from "./publicMemberTypes";
import {
  reservationCustomerSchema,
  type ReservationCustomerFormInput,
  type ReservationCustomerFormValues,
} from "./reservationCustomerSchema";

interface ReservationCustomerFormProps {
  defaultMemberId?: number | null | undefined;
  members: PublicMember[];
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
  "예약 확인과 매장 응대를 위해 회원 정보와 선택 입력 정보를 수집합니다.";
const marketingConsentDescription = "수신 동의는 선택이며, 동의하지 않아도 예약할 수 있습니다.";

export function ReservationCustomerForm({
  defaultMemberId = null,
  members,
  onSubmit,
  submitLabel = "입력 정보 확인",
  submitting = false,
}: ReservationCustomerFormProps) {
  const defaultMemberFormValue = toMemberFormValue(defaultMemberId);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<ReservationCustomerFormInput, unknown, ReservationCustomerFormValues>({
    defaultValues: {
      allergyNote: "",
      anniversaryDate: "",
      anniversaryType: "",
      marketingConsent: false,
      memberId: defaultMemberFormValue,
      privacyConsent: false,
      requestNotes: "",
      requestTemplateValues: [],
    },
    resolver: zodResolver(reservationCustomerSchema),
    shouldFocusError: true,
  });
  const memberFieldId = `reservation-member-${members[0]?.id ?? "empty"}`;

  useEffect(() => {
    setValue("memberId", defaultMemberFormValue, { shouldValidate: false });
  }, [defaultMemberFormValue, setValue]);

  return (
    <form
      className="grid gap-4 rounded-lg border bg-slate-50 p-4"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <h3 className="text-base font-semibold text-slate-950">예약 회원</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          회원 정보로 예약자와 연락처를 자동 연결합니다.
        </p>
      </div>

      <Field error={errors.memberId?.message} htmlFor={memberFieldId} label="회원" required>
        <div
          aria-describedby={getFieldDescriptionIds(memberFieldId, false, Boolean(errors.memberId))}
          aria-invalid={errors.memberId ? true : undefined}
          className="grid gap-2"
          role="radiogroup"
        >
          {members.map((member) => (
            <label
              className="flex cursor-pointer gap-3 rounded-md border bg-white p-3 text-sm transition hover:border-teal-600 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"
              htmlFor={`reservation-member-${member.id}`}
              key={member.id}
            >
              <input
                className="mt-1 size-5 shrink-0 border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-600"
                id={`reservation-member-${member.id}`}
                type="radio"
                value={member.id}
                {...register("memberId")}
              />
              <span className="grid min-w-0 flex-1 gap-2">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-950">{member.name}</span>
                    <span className="mt-0.5 block break-words text-xs leading-5 text-slate-500">
                      연락처 끝자리 {member.phoneLast4} · {member.email}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    회원 #{member.id}
                  </span>
                </span>
                <MemberProfileBadges member={member} />
              </span>
            </label>
          ))}
        </div>
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

function MemberProfileBadges({ member }: { member: PublicMember }) {
  const badges = [
    member.allergyNote ? `알레르기 ${member.allergyNote}` : null,
    member.anniversaryType ? formatAnniversary(member) : null,
    member.marketingOptIn ? "마케팅 수신 동의" : null,
  ].filter((badge): badge is string => Boolean(badge));

  if (badges.length === 0) {
    return null;
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
          key={badge}
        >
          {badge}
        </span>
      ))}
    </span>
  );
}

function formatAnniversary(member: PublicMember) {
  const typeLabels: Record<string, string> = {
    BIRTHDAY: "생일",
    OTHER: "기념일",
    WEDDING_ANNIVERSARY: "결혼기념일",
  };
  const typeLabel = typeLabels[member.anniversaryType ?? ""] ?? "기념일";

  return member.anniversaryDate ? `${typeLabel} ${member.anniversaryDate}` : typeLabel;
}

function toMemberFormValue(memberId: number | null | undefined) {
  return memberId ? String(memberId) : "";
}
