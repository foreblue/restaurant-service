import { expect, test, type Page } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:4181";

test.beforeEach(async ({ request }) => {
  await request.post(`${apiBaseUrl}/__mock/reset`);
});

test("CUST-RES-001 공개 예약 페이지에서 예약을 생성한다", async ({ page }) => {
  await page.goto("/r/cheongdam-main");

  await expect(page.getByRole("heading", { name: "청담 테스트 다이닝" })).toBeVisible();
  await expect(page.getByText("잔여 4명")).toBeHidden();

  await selectReservationSlot(page);
  await fillReservationCustomer(page, {
    allergyNote: "갑각류 알레르기",
    anniversaryDate: "05-18",
    anniversaryType: "BIRTHDAY",
    customerName: "홍길동",
    requestNotes: "창가 좌석이면 좋겠습니다.",
    requestTemplateLabel: "기념일 방문",
  });

  await page.getByRole("button", { name: "예약 완료" }).click();

  await expect(page.getByText("예약이 완료되었습니다.")).toBeVisible();
  await expect(page.getByText(/RSV-E2E-/)).toBeVisible();
  await expect(page.getByText("2026-05-18 18:00 · 2명")).toBeVisible();
  await expect(page.getByRole("link", { name: "예약 상세 확인" })).toBeVisible();
});

test("CUST-LOOKUP-001 예약번호와 휴대폰 번호로 조회 후 취소한다", async ({ page }) => {
  await page.goto("/reservations");

  await page.getByLabel("예약번호").fill("RSV-LOOKUP-0001");
  await page.getByLabel("휴대폰 번호").fill("01012345678");
  await page.getByRole("button", { name: "예약 조회" }).click();

  await expect(page).toHaveURL(/\/reservations\/301\?token=lookup-token-301/);
  await expect(page.getByText("예약 확정")).toBeVisible();
  await expect(page.getByText("예약번호 RSV-LOOKUP-0001")).toBeVisible();
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
  await page.goto("/r/cheongdam-main");

  await page.getByRole("button", { name: /예약금 코스/ }).click();
  await selectReservationSlot(page);
  await fillReservationCustomer(page, {
    customerName: "결제성공",
    phoneNumber: "01055556666",
    requestNotes: "결제 성공 테스트",
  });
  await page.getByRole("button", { name: "예약 후 결제 진행" }).click();

  await expect(page.getByText("예약이 완료되었습니다.")).toBeVisible();
  await expect(page.getByText("예약금 결제 단계가 이어집니다.")).toBeVisible();
  await page.getByRole("button", { name: "결제 진행" }).click();

  await expect(page.getByText("처리가 완료되었습니다.")).toBeVisible();
});

test("CUST-PAY-002 결제 실패 후 재시도와 예약 포기 동선을 노출한다", async ({ page }) => {
  await page.goto("/r/cheongdam-main");

  await page.getByRole("button", { name: /예약금 코스/ }).click();
  await selectReservationSlot(page);
  await fillReservationCustomer(page, {
    customerName: "결제실패",
    phoneNumber: "01077778888",
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
    customerName,
    phoneNumber = "01012341234",
    requestNotes,
    requestTemplateLabel,
  }: {
    allergyNote?: string;
    anniversaryDate?: string;
    anniversaryType?: "BIRTHDAY" | "OTHER" | "WEDDING_ANNIVERSARY";
    customerName: string;
    phoneNumber?: string;
    requestNotes?: string;
    requestTemplateLabel?: string;
  },
) {
  await page.getByLabel("이름").fill(customerName);
  await page.getByLabel("휴대폰 번호").fill(phoneNumber);

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
