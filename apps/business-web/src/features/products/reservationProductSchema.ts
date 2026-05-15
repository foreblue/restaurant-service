import { z } from "zod";

const businessDayValues = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const positiveIntegerString = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .regex(/^[1-9]\d*$/, message);

export const reservationProductFormSchema = z
  .object({
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
    minPartySize: positiveIntegerString("최소 인원은 1명 이상 정수로 입력해 주세요."),
    maxPartySize: positiveIntegerString("최대 인원은 1명 이상 정수로 입력해 주세요."),
    availableDays: z.array(z.enum(businessDayValues)).min(1, "예약 가능 요일을 선택해 주세요."),
    availableStartTime: z.string(),
    availableEndTime: z.string(),
    slotCapacity: positiveIntegerString("슬롯 재고는 1 이상 정수로 입력해 주세요."),
  })
  .superRefine((values, context) => {
    const minPartySize = Number(values.minPartySize);
    const maxPartySize = Number(values.maxPartySize);

    if (minPartySize > maxPartySize) {
      context.addIssue({
        code: "custom",
        path: ["maxPartySize"],
        message: "최소 인원은 최대 인원보다 클 수 없습니다.",
      });
    }

    if (maxPartySize > 20) {
      context.addIssue({
        code: "custom",
        path: ["maxPartySize"],
        message: "단체 예약 상품은 MVP 범위에서 제외됩니다.",
      });
    }

    const hasStartTime = Boolean(values.availableStartTime);
    const hasEndTime = Boolean(values.availableEndTime);

    if (hasStartTime !== hasEndTime) {
      context.addIssue({
        code: "custom",
        path: ["availableEndTime"],
        message: "예약 가능 시작/종료 시간을 함께 입력해 주세요.",
      });
    }

    if (
      values.availableStartTime &&
      values.availableEndTime &&
      values.availableStartTime >= values.availableEndTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["availableEndTime"],
        message: "예약 가능 시작 시간은 종료 시간보다 빨라야 합니다.",
      });
    }
  });

export type ReservationProductFormValues = z.infer<typeof reservationProductFormSchema>;

export const emptyReservationProductFormValues: ReservationProductFormValues = {
  name: "",
  description: "",
  priceAmount: "0",
  visible: true,
  minPartySize: "1",
  maxPartySize: "4",
  availableDays: [...businessDayValues],
  availableStartTime: "",
  availableEndTime: "",
  slotCapacity: "4",
};
