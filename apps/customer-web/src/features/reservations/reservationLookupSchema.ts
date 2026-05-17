import { z } from "zod";

export const reservationLookupSchema = z.object({
  reservationNumber: z
    .string()
    .trim()
    .min(1, "예약번호를 입력해 주세요.")
    .max(64, "예약번호는 64자 이하로 입력해 주세요."),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "휴대폰 번호를 입력해 주세요.")
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^01\d{8,9}$/.test(value), "휴대폰 번호 형식을 확인해 주세요."),
});

export type ReservationLookupFormInput = z.input<typeof reservationLookupSchema>;
export type ReservationLookupFormValues = z.output<typeof reservationLookupSchema>;
