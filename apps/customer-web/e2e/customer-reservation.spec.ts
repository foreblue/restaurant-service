import { expect, test, type Page } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:4181";

test.beforeEach(async ({ request }) => {
  await request.post(`${apiBaseUrl}/__mock/reset`);
});

test("CUST-RES-001 공개 예약 페이지에서 예약을 생성한다", async ({ page }) => {
  await loginAsMember(page, "1");

  await expect(page.getByRole("heading", { name: "청담 테스트 다이닝" })).toBeVisible();
  await expect(page.getByText("잔여 4명")).toBeHidden();

  await selectReservationSlot(page);
  await fillReservationCustomer(page, {
    allergyNote: "갑각류 알레르기",
    anniversaryDate: "05-18",
    anniversaryType: "BIRTHDAY",
    memberName: "김민지",
    requestNotes: "창가 좌석이면 좋겠습니다.",
    requestTemplateLabel: "기념일 방문",
  });

  await page.getByRole("button", { name: "예약 완료" }).click();

  await expect(page.getByText("예약이 완료되었습니다.")).toBeVisible();
  await expect(page.getByText(/RSV-E2E-/)).toBeVisible();
  await expect(page.getByText("2026-05-18 18:00 · 2명")).toBeVisible();
  await expect(page.getByRole("link", { name: "예약 상세 확인" })).toBeVisible();
});

test("CUST-LOOKUP-001 로그인 회원의 내 예약에서 조회 후 취소한다", async ({ page }) => {
  await loginAsMember(page, "1");
  await selectReservationSlot(page);
  await fillReservationCustomer(page, {
    memberName: "김민지",
    requestNotes: "내 예약 조회 테스트",
  });
  await page.getByRole("button", { name: "예약 완료" }).click();
  await expect(page.getByText("예약이 완료되었습니다.")).toBeVisible();
  const reservationNumberText =
    (await page
      .getByText(/RSV-E2E-/)
      .first()
      .textContent()) ?? "";
  const reservationNumber =
    reservationNumberText.match(/RSV-E2E-\d+/)?.[0] ?? reservationNumberText;

  await page.goto("/reservations");

  await expect(page.getByRole("heading", { level: 1, name: "내 예약" })).toBeVisible();
  await expect(page.getByText("김민지님의 예약")).toBeVisible();
  await expect(page.getByText(reservationNumber)).toBeVisible();
  await page.getByRole("link", { name: new RegExp(reservationNumber) }).click();

  await expect(page).toHaveURL(/\/reservations\/\d+\?memberId=1/);
  await expect(page.getByText("예약 확정")).toBeVisible();
  await expect(page.getByText(`예약번호 ${reservationNumber}`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "결제/환불 상태" })).toBeVisible();
  await expect(page.getByText("결제 없음")).toBeVisible();
  await expect(page.getByText("환불 예정 없음")).toBeVisible();

  await page.getByLabel("취소 사유").fill("일정 변경");
  const cancelButton = page.getByRole("button", { name: "예약 취소" }).first();
  await expect(cancelButton).toBeEnabled();
  await cancelButton.click();
  await page
    .getByRole("dialog", { name: "예약을 취소할까요?" })
    .getByRole("button", {
      name: "예약 취소",
    })
    .click();

  await expect(page.getByText("고객 취소")).toBeVisible();
  await expect(page.getByText("취소 완료", { exact: true })).toBeVisible();
  await expect(page.getByText("일정 변경")).toBeVisible();
});

test("CUST-PAY-001 예약금 결제 성공 상태를 표시한다", async ({ page }) => {
  await loginAsMember(page, "2");

  await page.getByRole("button", { name: /예약금 코스/ }).click();
  await selectReservationSlot(page);
  await fillReservationCustomer(page, {
    memberName: "박지수",
    requestNotes: "결제 성공 테스트",
  });
  await page.getByRole("button", { name: "예약 후 결제 진행" }).click();

  await expect(page.getByText("예약이 완료되었습니다.")).toBeVisible();
  await expect(page.getByText("예약금 결제 단계가 이어집니다.")).toBeVisible();
  await page.getByRole("button", { name: "결제 진행" }).click();

  await expect(page.getByText("처리가 완료되었습니다.")).toBeVisible();
});

test("CUST-PAY-002 결제 실패 후 재시도와 예약 포기 동선을 노출한다", async ({ page }) => {
  await loginAsMember(page, "3");

  await page.getByRole("button", { name: /예약금 코스/ }).click();
  await selectReservationSlot(page);
  await fillReservationCustomer(page, {
    memberName: "결제실패",
    requestNotes: "결제 실패 테스트",
  });
  await page.getByRole("button", { name: "예약 후 결제 진행" }).click();

  await expect(page.getByText("예약이 완료되었습니다.")).toBeVisible();
  await page.getByRole("button", { name: "결제 진행" }).click();
  await expect(page.getByText("결제 처리를 완료하지 못했습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(page.getByRole("button", { name: "예약 포기" })).toBeVisible();

  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByText("결제 처리를 완료하지 못했습니다.")).toBeHidden();

  await page.getByRole("button", { name: "결제 진행" }).click();
  await expect(page.getByText("결제 처리를 완료하지 못했습니다.")).toBeVisible();
  await page.getByRole("button", { name: "예약 포기" }).click();

  await expect(page.getByText("예약을 포기했습니다.")).toBeVisible();
});

async function loginAsMember(page: Page, memberId: string) {
  await page.goto(`/login?redirect=${encodeURIComponent("/r/cheongdam-main")}`);
  await page.getByLabel("회원 ID").fill(memberId);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByText("로그인 완료")).toBeVisible();
  await page.getByRole("link", { name: "예약 계속하기" }).click();
}

async function selectReservationSlot(page: Page) {
  const dinnerProduct = page.getByRole("button", { name: /디너 코스/ });
  await expect(dinnerProduct).toContainText("홀");
  await expect(dinnerProduct).toContainText("룸");

  await page.getByRole("button", { name: "2026-05-18" }).click();
  await expect(page.getByRole("button", { name: /18:00/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /20:00/ })).toBeDisabled();
  await expect(page.getByText("임시 마감")).toBeVisible();
  await page.getByRole("button", { name: /18:00/ }).click();

  await expect(page.getByText("예약 전 확인")).toBeVisible();
  await expect(page.getByText("잔여 4명")).toBeVisible();
}

async function fillReservationCustomer(
  page: Page,
  {
    allergyNote,
    anniversaryDate,
    anniversaryType,
    memberName = "김민지",
    requestNotes,
    requestTemplateLabel,
  }: {
    allergyNote?: string;
    anniversaryDate?: string;
    anniversaryType?: "BIRTHDAY" | "OTHER" | "WEDDING_ANNIVERSARY";
    memberName?: string;
    requestNotes?: string;
    requestTemplateLabel?: string;
  },
) {
  await page.getByLabel(new RegExp(memberName)).check();

  if (requestNotes) {
    await page.getByLabel("요청사항").fill(requestNotes);
  }

  if (allergyNote) {
    await page.getByLabel("알레르기").fill(allergyNote);
  }

  if (anniversaryType) {
    await page.getByLabel("기념일", { exact: true }).selectOption(anniversaryType);
  }

  if (anniversaryDate) {
    await page.getByLabel("기념일 날짜").fill(anniversaryDate);
  }

  if (requestTemplateLabel) {
    await page.getByLabel(requestTemplateLabel).check();
  }

  await page.getByLabel("개인정보 수집에 동의합니다.").check();
}
