import { type PublicReservationStatus } from "./reservationCreateTypes";

export type ReservationStatusVariant = "error" | "info" | "success" | "warning";

export interface ReservationStatusView {
  description: string;
  label: string;
  variant: ReservationStatusVariant;
}

const statusViews: Record<PublicReservationStatus, ReservationStatusView> = {
  CANCELLED_BY_CUSTOMER: {
    description: "고객 요청으로 취소가 완료된 예약입니다.",
    label: "고객 취소",
    variant: "warning",
  },
  CANCELLED_BY_RESTAURANT: {
    description: "매장 사정으로 취소된 예약입니다. 필요한 경우 매장에 문의해 주세요.",
    label: "매장 취소",
    variant: "warning",
  },
  COMPLETED: {
    description: "방문이 완료된 예약입니다.",
    label: "방문 완료",
    variant: "info",
  },
  CONFIRMED: {
    description: "방문 일정이 확정된 예약입니다.",
    label: "예약 확정",
    variant: "success",
  },
  MODIFIED: {
    description: "매장에서 변경한 방문 정보가 반영된 예약입니다.",
    label: "예약 변경",
    variant: "warning",
  },
  NO_SHOW: {
    description: "예약 시간에 방문하지 않아 노쇼로 처리된 예약입니다.",
    label: "노쇼",
    variant: "warning",
  },
  PENDING: {
    description: "매장에서 예약을 확인 중입니다. 확정 전까지 방문 정보가 바뀔 수 있습니다.",
    label: "예약 접수",
    variant: "info",
  },
};

export function formatReservationStatus(status: PublicReservationStatus) {
  return getReservationStatusView(status).label;
}

export function getReservationStatusView(status: PublicReservationStatus): ReservationStatusView {
  return (
    statusViews[status] ?? {
      description: "예약 상태를 확인해 주세요.",
      label: status,
      variant: "info",
    }
  );
}

export function isCancelledReservationStatus(status: PublicReservationStatus) {
  return status === "CANCELLED_BY_CUSTOMER" || status === "CANCELLED_BY_RESTAURANT";
}

export function isActiveReservationStatus(status: PublicReservationStatus) {
  return status === "CONFIRMED" || status === "MODIFIED";
}
