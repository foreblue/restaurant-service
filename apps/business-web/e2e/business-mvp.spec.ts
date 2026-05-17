import { expect, test, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "사업자 로그인" })).toBeVisible();

  await page.getByLabel("이메일").fill("owner@example.com");
  await page.getByLabel("비밀번호").fill("password123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.getByRole("heading", { name: "운영 현황" })).toBeVisible();
}

test.describe("Business FE MVP QA", () => {
  test("BIZ-AUTH-001 보호 라우트에서 로그인 후 원래 업무 화면으로 이동한다", async ({ page }) => {
    await page.goto("/reservations");

    await expect(page.getByRole("heading", { name: "사업자 로그인" })).toBeVisible();
    await expect(page.getByText("로그인이 필요하거나 세션이 만료되었습니다.")).toBeVisible();

    await page.getByLabel("이메일").fill("owner@example.com");
    await page.getByLabel("비밀번호").fill("password123");
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page.getByRole("heading", { name: "예약 운영" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "주요 메뉴" })).toBeVisible();

    await page.getByRole("button", { name: "로그아웃" }).click();

    await expect(page.getByRole("heading", { name: "사업자 로그인" })).toBeVisible();
  });

  test("BIZ-ONB-001 입점 신청을 작성하고 서류 업로드 후 제출한다", async ({ page }) => {
    await loginAsOwner(page);
    await page.getByRole("link", { name: "입점 신청" }).click();

    await expect(page.getByRole("heading", { name: "입점 신청 시작" })).toBeVisible();
    await page.getByRole("button", { name: "신청 작성 시작" }).click();

    await expect(page.getByRole("heading", { name: "입점 신청" })).toBeVisible();
    await page.getByLabel("매장명").fill("청담 테스트 키친");
    await page.getByLabel("매장 전화번호").fill("02-1234-5678");
    await page.getByRole("textbox", { name: "주소", exact: true }).fill("서울시 강남구 테스트로 1");
    await page.getByLabel("음식 종류").fill("한식, 코스");
    await page.getByRole("button", { name: "다음" }).click();

    await expect(page.getByRole("heading", { name: "사업자 정보" })).toBeVisible();
    await page.getByLabel("사업자등록번호").fill("1234567890");
    await page.getByLabel("상호명").fill("청담 테스트");
    await page.getByLabel("대표자명").fill("김대표");
    await page.getByLabel("사업장 주소").fill("서울시 강남구 테스트로 1");
    await page.getByRole("button", { name: "다음" }).click();

    await expect(page.getByRole("heading", { name: "담당자 연락처" })).toBeVisible();
    await page.getByLabel("담당자 이름").fill("박매니저");
    await page.getByLabel("담당자 연락처").fill("010-1234-5678");
    await page.getByLabel("담당자 이메일").fill("manager@example.com");
    await page.getByRole("button", { name: "다음" }).click();

    await expect(page.getByRole("heading", { name: "서류 업로드" })).toBeVisible();
    await page.getByLabel("사업자등록증").setInputFiles({
      name: "business-license.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("license"),
    });
    await expect(page.getByText("business-license.pdf 업로드 완료")).toBeVisible();
    await page.getByLabel("대표 이미지").setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: Buffer.from("cover"),
    });
    await expect(page.getByText("cover.png 업로드 완료")).toBeVisible();
    await page.getByRole("button", { name: "다음" }).click();

    await expect(page.getByRole("heading", { name: "제출 확인" })).toBeVisible();
    await page.getByRole("button", { name: "승인 요청 제출" }).click();

    await expect(page.getByRole("heading", { name: "입점 신청 상태" })).toBeVisible();
    await expect(page.getByText("승인 검토 중")).toBeVisible();
  });

  test("BIZ-RES-001 예약 상세 확인, 운영 메모 저장, 수동 예약 등록을 수행한다", async ({
    page,
  }) => {
    await loginAsOwner(page);
    await page.getByRole("link", { name: "예약 운영" }).click();

    await expect(page.getByRole("heading", { name: "예약 운영" })).toBeVisible();
    await expect(page.getByText("일별 예약 리스트")).toBeVisible();
    await expect(page.getByText("주간 캘린더")).toBeVisible();
    await expect(page.getByText("김예약").first()).toBeVisible();

    await page.getByRole("button", { name: "김예약 상세 열기" }).click();
    await expect(page.getByRole("heading", { name: "예약 상세" })).toBeVisible();
    await expect(page.getByText("RSV-7001").first()).toBeVisible();
    await expect(page.getByText("010-1234-5678")).toBeVisible();

    await page
      .getByPlaceholder("전화 확인 내용, 좌석 배정 참고사항 등")
      .fill("창가 자리 전화 확인");
    await page.getByRole("button", { name: "운영 메모 저장" }).click();
    await expect(page.getByText("운영 메모가 저장되었습니다.")).toBeVisible();

    await page.getByRole("button", { name: "수동 예약 등록" }).click();
    await expect(page.getByRole("dialog", { name: "수동 예약 등록" })).toBeVisible();
    await page.getByLabel("예약 상품").selectOption("6001");
    await page.getByLabel("고객명").fill("한전화");
    await page.getByLabel("고객 전화번호").fill("010-7777-1212");
    await page.getByLabel("방문 시간").fill("12:30");
    await page.getByLabel("인원").fill("3");
    await page.getByLabel("고객 요청사항").fill("유아 의자 필요");
    await page.getByRole("button", { name: "등록", exact: true }).click();

    await expect(page.getByText("수동 예약이 등록되었습니다.")).toBeVisible();
    await expect(page.getByText("한전화").first()).toBeVisible();
  });

  test("BIZ-PAY-001 결제/환불 운영 화면에서 실패 환불의 대응 문구를 확인한다", async ({ page }) => {
    await loginAsOwner(page);
    await page.getByRole("link", { name: "결제/환불" }).click();

    await expect(page.getByRole("heading", { name: "결제/환불 내역" })).toBeVisible();
    await expect(page.getByText("결제 건수")).toBeVisible();

    await page.getByRole("button", { name: "환불" }).click();
    await expect(page.getByText("환불 건수")).toBeVisible();

    await page.getByLabel("환불 상태").selectOption("FAILED");

    await expect(page.getByText("REF-9203")).toBeVisible();
    await expect(page.getByText("PG 승인 거절")).toBeVisible();
    await page.getByRole("button", { name: "REF-9203 상세 보기" }).click();

    await expect(page.getByRole("heading", { name: "환불 상세" })).toBeVisible();
    await expect(
      page.getByText("플랫폼 관리자 문의 필요: 환불 실패 또는 보정 대상입니다."),
    ).toBeVisible();
    await expect(
      page.getByText("정산금 계산이나 지급 스케줄은 이 화면에서 제공하지 않습니다.").first(),
    ).toBeVisible();
  });

  test("BIZ-UI-001 모바일 뷰포트에서 예약 테이블과 상세 패널 핵심 정보가 보인다", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsOwner(page);
    await page.getByRole("link", { name: "예약 운영" }).click();

    await expect(page.getByRole("heading", { name: "예약 운영" })).toBeVisible();
    await expect(page.getByText("일별 예약 리스트")).toBeVisible();
    await page.getByRole("button", { name: "김예약 상세 열기" }).click();
    await expect(page.getByRole("heading", { name: "예약 상세" })).toBeVisible();
    await expect(page.getByText("고객 정보")).toBeVisible();
    await expect(page.getByRole("heading", { name: "운영 메모" })).toBeVisible();

    await testInfo.attach("mobile-reservation-detail", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
