import { z } from "zod";

export const contactInfoSchema = z.object({
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
  privacyConsent: z.boolean().refine((value) => value, "개인정보 수집에 동의해 주세요."),
});

export type ContactInfoFormValues = z.output<typeof contactInfoSchema>;
