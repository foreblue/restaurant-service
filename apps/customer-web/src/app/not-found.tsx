import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { StateBlock } from "@/components/ui";

export default function NotFound() {
  return (
    <ReservationPageShell
      description="링크가 변경되었거나 아직 공개되지 않은 예약 페이지입니다."
      eyebrow="예약 불가"
      title="예약 페이지를 이용할 수 없습니다."
    >
      <StateBlock title="공개되지 않았거나 사용할 수 없는 링크입니다." variant="empty">
        <p>예약을 진행하려면 매장에서 다시 공유한 최신 링크를 확인해 주세요.</p>
      </StateBlock>
    </ReservationPageShell>
  );
}
