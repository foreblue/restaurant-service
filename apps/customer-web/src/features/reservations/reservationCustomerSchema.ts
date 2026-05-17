import { z } from "zod";

export const reservationCustomerSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(40, "이름은 40자 이하로 입력해 주세요."),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "휴대폰 번호를 입력해 주세요.")
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^01\d{8,9}$/.test(value), "휴대폰 번호 형식을 확인해 주세요."),
  email: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "이메일 형식을 확인해 주세요.",
    ),
  requestNotes: z
    .string()
    .trim()
    .max(500, "요청사항은 500자 이하로 입력해 주세요.")
    .transform((value) => value || null),
  privacyConsent: z.boolean().refine((value) => value, "개인정보 수집에 동의해 주세요."),
  marketingConsent: z.boolean(),
});

export type ReservationCustomerFormInput = z.input<typeof reservationCustomerSchema>;
export type ReservationCustomerFormValues = z.output<typeof reservationCustomerSchema>;
