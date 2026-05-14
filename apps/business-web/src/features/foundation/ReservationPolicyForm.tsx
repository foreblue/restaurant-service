import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Alert,
  Button,
  Checkbox,
  DateInput,
  Field,
  fieldA11y,
  Input,
  Select,
} from "@/components/ui";
import {
  type ReservationPolicyFormInput,
  type ReservationPolicyFormValues,
  reservationPolicySchema,
} from "@/features/foundation/reservationPolicySchema";

interface ReservationPolicyFormProps {
  defaultValues?: Partial<ReservationPolicyFormValues>;
  submitError?: string;
  onSubmit: (values: ReservationPolicyFormValues) => void | Promise<void>;
}

const baseDefaultValues: ReservationPolicyFormValues = {
  productName: "",
  maxGuests: 2,
  status: "draft",
  openDate: "",
  depositRequired: false,
};

export function ReservationPolicyForm({
  defaultValues,
  submitError,
  onSubmit,
}: ReservationPolicyFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ReservationPolicyFormInput, unknown, ReservationPolicyFormValues>({
    defaultValues: {
      ...baseDefaultValues,
      ...defaultValues,
    },
    mode: "onBlur",
    resolver: zodResolver(reservationPolicySchema),
  });

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Field
        id="product-name"
        label="상품명"
        error={errors.productName?.message}
        description="운영 화면과 공개 예약 페이지에 함께 쓰이는 이름"
      >
        <Input
          id="product-name"
          invalid={Boolean(errors.productName)}
          {...fieldA11y("product-name", {
            error: errors.productName?.message,
            hasDescription: true,
          })}
          {...register("productName")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="max-guests" label="최대 인원" error={errors.maxGuests?.message}>
          <Input
            id="max-guests"
            invalid={Boolean(errors.maxGuests)}
            min={1}
            type="number"
            {...fieldA11y("max-guests", { error: errors.maxGuests?.message })}
            {...register("maxGuests")}
          />
        </Field>

        <Field id="open-date" label="예약 시작일" error={errors.openDate?.message}>
          <DateInput
            id="open-date"
            invalid={Boolean(errors.openDate)}
            {...fieldA11y("open-date", { error: errors.openDate?.message })}
            {...register("openDate")}
          />
        </Field>
      </div>

      <Field id="status" label="노출 상태" error={errors.status?.message}>
        <Select
          id="status"
          invalid={Boolean(errors.status)}
          options={[
            { label: "작성 중", value: "draft" },
            { label: "공개", value: "published" },
          ]}
          {...fieldA11y("status", { error: errors.status?.message })}
          {...register("status")}
        />
      </Field>

      <Checkbox id="deposit-required" label="예약금 설정 필요" {...register("depositRequired")} />

      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          저장
        </Button>
      </div>
    </form>
  );
}
