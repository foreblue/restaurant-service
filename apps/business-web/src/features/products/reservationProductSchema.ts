import { z } from "zod";

export const reservationProductFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "상품명을 입력해 주세요.")
    .max(80, "상품명은 80자 이하여야 합니다."),
  description: z.string().max(500, "설명은 500자 이하여야 합니다."),
  priceAmount: z
    .string()
    .trim()
    .min(1, "가격을 입력해 주세요.")
    .regex(/^\d+$/, "가격은 0 이상의 정수로 입력해 주세요."),
  visible: z.boolean(),
});

export type ReservationProductFormValues = z.infer<typeof reservationProductFormSchema>;

export const emptyReservationProductFormValues: ReservationProductFormValues = {
  name: "",
  description: "",
  priceAmount: "0",
  visible: true,
};
