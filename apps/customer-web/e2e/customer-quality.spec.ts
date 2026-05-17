import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:4181";

test.beforeEach(async ({ request }) => {
  await request.post(`${apiBaseUrl}/__mock/reset`);
});

test("CUST-QA-001 모바일 긴 콘텐츠 예약 플로우에서 가로 overflow가 없다", async ({
  page,
  request,
}) => {
  await request.post(`${apiBaseUrl}/__mock/scenario`, {
    data: { scenario: "long-content" },
  });
  await page.setViewportSize({ height: 844, width: 390 });

  await page.goto("/r/cheongdam-main");
  await expect(
    page.getByRole("heading", {
      name: "청담 테스트 다이닝 프라이빗 셰프 테이블 긴 매장명 검증 지점",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /계절 한정 셰프 테이스팅/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "2026-05-18" }).click();
  await page.getByRole("button", { name: /18:00/ }).click();
  await expect(page.getByText("예약 전 확인")).toBeVisible();
  await test.info().attach("customer-mobile-long-content", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  await expectNoHorizontalOverflow(page);
});

test("CUST-QA-002 공개 예약 페이지는 기본 접근성 위반이 없다", async ({ page }) => {
  await page.goto("/r/cheongdam-main");
  await expect(page.getByRole("button", { name: "2026-05-18" })).toBeVisible();

  const results = await new AxeBuilder({ page }).include("main").analyze();

  expect(results.violations).toEqual([]);
});

test("CUST-QA-003 API 응답 지연 중 가능 날짜 로딩 상태를 표시한다", async ({ page }) => {
  await page.route(
    `${apiBaseUrl}/api/public/restaurants/101/availability/dates**`,
    async (route) => {
      await page.waitForTimeout(600);
      await route.continue();
    },
  );

  await page.goto("/r/cheongdam-main");

  await expect(page.getByText("가능 날짜를 불러오는 중입니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "2026-05-18" })).toBeVisible();
});

test("CUST-QA-004 예약 페이지 LCP와 CLS 기준을 수집한다", async ({ page }) => {
  await installPerformanceProbe(page);
  await page.goto("/r/cheongdam-main");
  await page.getByRole("button", { name: "2026-05-18" }).click();
  await page.getByRole("button", { name: /18:00/ }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => window.__customerQualityMetrics);

  expect(metrics.cls).toBeLessThanOrEqual(0.1);
  expect(metrics.lcp).toBeGreaterThan(0);
  expect(metrics.lcp).toBeLessThan(5_000);
});

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;

    return Math.max(0, documentWidth - viewportWidth);
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

async function installPerformanceProbe(page: Page) {
  await page.addInitScript(() => {
    window.__customerQualityMetrics = { cls: 0, lcp: 0 };

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          window.__customerQualityMetrics.lcp = entry.startTime;
        }
      }
    }).observe({ buffered: true, type: "largest-contentful-paint" });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };

        if (!layoutShift.hadRecentInput) {
          window.__customerQualityMetrics.cls += layoutShift.value ?? 0;
        }
      }
    }).observe({ buffered: true, type: "layout-shift" });
  });
}

declare global {
  interface Window {
    __customerQualityMetrics: {
      cls: number;
      lcp: number;
    };
  }
}
