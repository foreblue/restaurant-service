import { z } from "zod";

export const reservationCustomerSchema = z.object({
  memberId: z.coerce.number().int().positive("예약할 회원을 선택해 주세요."),
  requestNotes: z
    .string()
    .trim()
    .max(500, "요청사항은 500자 이하로 입력해 주세요.")
    .transform((value) => value || null),
  allergyNote: z
    .string()
    .trim()
    .max(1000, "알레르기 정보는 1000자 이하로 입력해 주세요.")
    .optional()
    .default("")
    .transform((value) => value || null),
  anniversaryType: z
    .string()
    .trim()
    .max(40, "기념일 유형은 40자 이하로 입력해 주세요.")
    .optional()
    .default("")
    .transform((value) => value || null),
  anniversaryDate: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => value || null)
    .refine(
      (value) => value === null || /^\d{2}-\d{2}$|^\d{4}-\d{2}-\d{2}$/.test(value),
      "기념일 날짜는 MM-DD 또는 YYYY-MM-DD 형식으로 입력해 주세요.",
    ),
  requestTemplateValues: z
    .array(z.string().trim().min(1).max(80))
    .max(10, "요청사항 템플릿은 10개 이하로 선택해 주세요.")
    .optional()
    .default([]),
  privacyConsent: z.boolean().refine((value) => value, "개인정보 수집에 동의해 주세요."),
  marketingConsent: z.boolean(),
});

export type ReservationCustomerFormInput = z.input<typeof reservationCustomerSchema>;
export type ReservationCustomerFormValues = z.output<typeof reservationCustomerSchema>;
