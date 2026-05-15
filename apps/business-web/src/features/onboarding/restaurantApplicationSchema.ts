import { z } from "zod";

export const restaurantApplicationSchema = z.object({
  restaurantName: z.string().trim().min(1, "매장명을 입력해 주세요."),
  restaurantDescription: z
    .string()
    .trim()
    .max(500, "소개는 500자 이내로 입력해 주세요.")
    .optional(),
  restaurantPhone: z.string().trim().max(32, "전화번호는 32자 이내로 입력해 주세요.").optional(),
  addressLine1: z.string().trim().min(1, "주소를 입력해 주세요."),
  addressLine2: z.string().trim().max(255, "상세 주소는 255자 이내로 입력해 주세요.").optional(),
  postalCode: z.string().trim().max(20, "우편번호는 20자 이내로 입력해 주세요.").optional(),
  cuisineTypesCsv: z.string().trim().optional(),
  businessRegistrationNo: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "사업자등록번호는 숫자 10자리로 입력해 주세요."),
  businessName: z.string().trim().min(1, "상호명을 입력해 주세요."),
  representativeName: z.string().trim().min(1, "대표자명을 입력해 주세요."),
  businessAddress: z.string().trim().min(1, "사업장 주소를 입력해 주세요."),
  managerName: z.string().trim().min(1, "담당자 이름을 입력해 주세요."),
  managerPhone: z.string().trim().min(1, "담당자 연락처를 입력해 주세요."),
  managerEmail: z.email("담당자 이메일을 올바르게 입력해 주세요."),
});

export type RestaurantApplicationFormValues = z.infer<typeof restaurantApplicationSchema>;

export const onboardingSteps = [
  {
    id: "restaurant",
    title: "매장 기본 정보",
    fields: [
      "restaurantName",
      "restaurantDescription",
      "restaurantPhone",
      "addressLine1",
      "addressLine2",
      "postalCode",
      "cuisineTypesCsv",
    ],
  },
  {
    id: "business",
    title: "사업자 정보",
    fields: ["businessRegistrationNo", "businessName", "representativeName", "businessAddress"],
  },
  {
    id: "manager",
    title: "담당자 연락처",
    fields: ["managerName", "managerPhone", "managerEmail"],
  },
] as const;
