import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "매장명은 2자 이상 입력해 주세요.")
    .max(80, "매장명은 80자 이내로 입력해 주세요."),
  description: z.string().trim().max(500, "소개는 500자 이내로 입력해 주세요.").optional(),
  phone: z.string().trim().min(1, "매장 전화번호를 입력해 주세요."),
  addressLine1: z.string().trim().min(1, "주소를 입력해 주세요."),
  addressLine2: z.string().trim().max(255, "상세 주소는 255자 이내로 입력해 주세요.").optional(),
  postalCode: z.string().trim().max(20, "우편번호는 20자 이내로 입력해 주세요.").optional(),
  cuisineTypesCsv: z.string().trim().min(1, "음식 종류를 하나 이상 입력해 주세요."),
  coverImageFileId: z.number().nullable().optional(),
  coverImageFilename: z.string().optional(),
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;
