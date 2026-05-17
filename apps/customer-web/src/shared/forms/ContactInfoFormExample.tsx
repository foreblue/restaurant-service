"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";

import { Button, Checkbox, Field, getFieldDescriptionIds, Input } from "@/components/ui";

import { contactInfoSchema, type ContactInfoFormValues } from "./contactInfoSchema";

interface ContactInfoFormExampleProps {
  onSubmit: SubmitHandler<ContactInfoFormValues>;
}

export function ContactInfoFormExample({ onSubmit }: ContactInfoFormExampleProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ContactInfoFormValues>({
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      privacyConsent: false,
    },
    resolver: zodResolver(contactInfoSchema),
  });

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Field
        error={errors.customerName?.message}
        htmlFor="example-customer-name"
        label="이름"
        required
      >
        <Input
          autoComplete="name"
          id="example-customer-name"
          invalid={Boolean(errors.customerName)}
          {...register("customerName")}
          aria-describedby={getFieldDescriptionIds(
            "example-customer-name",
            false,
            Boolean(errors.customerName),
          )}
        />
      </Field>

      <Field
        error={errors.phoneNumber?.message}
        htmlFor="example-phone-number"
        label="휴대폰 번호"
        required
      >
        <Input
          autoComplete="tel"
          id="example-phone-number"
          inputMode="tel"
          invalid={Boolean(errors.phoneNumber)}
          placeholder="01012345678"
          {...register("phoneNumber")}
          aria-describedby={getFieldDescriptionIds(
            "example-phone-number",
            false,
            Boolean(errors.phoneNumber),
          )}
        />
      </Field>

      <Checkbox
        error={errors.privacyConsent?.message}
        id="example-privacy-consent"
        label="개인정보 수집에 동의합니다."
        {...register("privacyConsent")}
      />

      <Button disabled={isSubmitting} type="submit">
        예약 정보 확인
      </Button>
    </form>
  );
}
