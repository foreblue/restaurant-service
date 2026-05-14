import { z } from "zod";

export const reservationPolicySchema = z.object({
  productName: z.string().trim().min(2, "상품명은 2자 이상 입력해 주세요."),
  maxGuests: z.coerce
    .number({ error: "최대 인원을 입력해 주세요." })
    .int("최대 인원은 정수로 입력해 주세요.")
    .min(1, "최대 인원은 1명 이상이어야 합니다.")
    .max(20, "MVP 기준 최대 인원은 20명까지입니다."),
  status: z.enum(["draft", "published"], { error: "노출 상태를 선택해 주세요." }),
  openDate: z.string().min(1, "예약 시작일을 선택해 주세요."),
  depositRequired: z.boolean(),
});

export type ReservationPolicyFormInput = z.input<typeof reservationPolicySchema>;
export type ReservationPolicyFormValues = z.output<typeof reservationPolicySchema>;
