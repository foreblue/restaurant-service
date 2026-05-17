import { type PublicReservationStatus } from "./reservationCreateTypes";

export function formatReservationStatus(status: PublicReservationStatus) {
  const labels: Record<PublicReservationStatus, string> = {
    CANCELLED_BY_CUSTOMER: "고객 취소",
    CANCELLED_BY_RESTAURANT: "매장 취소",
    COMPLETED: "방문 완료",
    CONFIRMED: "예약 확정",
    MODIFIED: "예약 변경",
    NO_SHOW: "노쇼",
    PENDING: "예약 접수",
  };

  return labels[status] ?? status;
}

export function isCancelledReservationStatus(status: PublicReservationStatus) {
  return status === "CANCELLED_BY_CUSTOMER" || status === "CANCELLED_BY_RESTAURANT";
}
