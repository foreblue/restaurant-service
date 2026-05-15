import { fireEvent, render, screen } from "@testing-library/react";

import {
  type BusinessApiClient,
  type RestaurantApplicationResponse,
  type RestaurantSettingsResponse,
} from "@/shared/api/businessApiClient";

import App from "./App";

const mockSession = {
  id: 1,
  email: "owner@example.com",
  displayName: "청담 본점 오너",
  role: "OWNER",
  status: "ACTIVE",
  restaurant: {
    id: 1,
    status: "REJECTED",
  },
};

const mockRestaurant: RestaurantSettingsResponse = {
  id: 1,
  status: "APPROVED",
  name: "청담 본점",
  slug: "cheongdam-main",
  description: "제철 식재료로 준비하는 예약제 다이닝입니다.",
  phone: "02-1234-5678",
  addressLine1: "서울시 강남구 테스트로 1",
  addressLine2: "2층",
  postalCode: "06000",
  cuisineTypes: ["한식", "코스"],
  coverImageFileId: null,
  timezone: "Asia/Seoul",
  approvedAt: "2026-05-15T00:00:00.000Z",
  reservationPage: {
    id: 1,
    slug: "cheongdam-main",
    status: "PRIVATE",
    publishedAt: null,
    unpublishedAt: null,
    publicUrl: "/r/cheongdam-main",
    publishable: true,
    publishBlockers: [],
  },
  businessHours: [],
  holidayRules: [],
};

describe("App routing", () => {
  beforeEach(() => {
    if (typeof window.localStorage?.clear === "function") {
      window.localStorage.clear();
    }

    window.history.pushState({}, "", "/");
  });

  it("redirects unauthenticated users to the login route", async () => {
    window.history.pushState({}, "", "/reservations");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "사업자 로그인" })).toBeInTheDocument();
    expect(screen.getByText("로그인이 필요하거나 세션이 만료되었습니다.")).toBeInTheDocument();
  });

  it("logs in and logs out with the mock auth adapter", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("heading", { name: "운영 현황" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "주요 메뉴" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByRole("heading", { name: "사업자 로그인" })).toBeInTheDocument();
  });

  it("shows a clear authentication failure message", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "invalid@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다."),
    ).toBeInTheDocument();
  });

  it("requests a password reset from the public auth route", async () => {
    window.history.pushState({}, "", "/password-reset");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "비밀번호 재설정" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 요청" }));

    expect(await screen.findByText("비밀번호 재설정 요청이 접수되었습니다.")).toBeInTheDocument();
  });

  it("submits a restaurant application with uploaded documents", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "입점 신청" }));

    expect(await screen.findByRole("heading", { name: "입점 신청 시작" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "신청 작성 시작" }));

    expect(await screen.findByRole("heading", { name: "입점 신청" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(await screen.findByText("매장명을 입력해 주세요.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("매장명"), {
      target: { value: "청담 테스트 키친" },
    });
    fireEvent.change(screen.getByLabelText("매장 전화번호"), {
      target: { value: "02-1234-5678" },
    });
    fireEvent.change(screen.getByLabelText("주소"), {
      target: { value: "서울시 강남구 테스트로 1" },
    });
    fireEvent.change(screen.getByLabelText("음식 종류"), {
      target: { value: "한식, 코스" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByRole("heading", { name: "사업자 정보" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("사업자등록번호"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText("상호명"), {
      target: { value: "청담 테스트" },
    });
    fireEvent.change(screen.getByLabelText("대표자명"), {
      target: { value: "김대표" },
    });
    fireEvent.change(screen.getByLabelText("사업장 주소"), {
      target: { value: "서울시 강남구 테스트로 1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByRole("heading", { name: "담당자 연락처" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("담당자 이름"), {
      target: { value: "박매니저" },
    });
    fireEvent.change(screen.getByLabelText("담당자 연락처"), {
      target: { value: "010-1234-5678" },
    });
    fireEvent.change(screen.getByLabelText("담당자 이메일"), {
      target: { value: "manager@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByText("작성중 신청이 저장되었습니다.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "서류 업로드" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(await screen.findByText("사업자등록증을 업로드해 주세요.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("사업자등록증"), {
      target: {
        files: [new File(["license"], "business-license.pdf", { type: "application/pdf" })],
      },
    });
    expect(await screen.findByText("business-license.pdf 업로드 완료")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("대표 이미지"), {
      target: {
        files: [new File(["cover"], "cover.png", { type: "image/png" })],
      },
    });
    expect(await screen.findByText("cover.png 업로드 완료")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(await screen.findByRole("heading", { name: "제출 확인" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "승인 요청 제출" }));
    expect(await screen.findByRole("heading", { name: "입점 신청 상태" })).toBeInTheDocument();
    expect(screen.getByText("승인 검토 중")).toBeInTheDocument();
  });

  it("shows rejection reason and lets owners re-enter editing", async () => {
    const rejectedApplication: RestaurantApplicationResponse = {
      id: 1001,
      status: "REJECTED",
      restaurant: {
        id: 2001,
        status: "REJECTED",
        name: "청담 테스트 키친",
        slug: null,
        description: null,
        phone: "02-1234-5678",
        addressLine1: "서울시 강남구 테스트로 1",
        addressLine2: null,
        postalCode: null,
        cuisineTypes: ["한식"],
        coverImageFileId: null,
        timezone: "Asia/Seoul",
      },
      businessRegistrationNo: "1234567890",
      businessName: "청담 테스트",
      representativeName: "김대표",
      businessAddress: "서울시 강남구 테스트로 1",
      businessLicenseFileId: 3001,
      managerName: "박매니저",
      managerPhone: "010-1234-5678",
      managerEmail: "manager@example.com",
      contactVerified: true,
      submittedAt: "2026-05-15T00:00:00.000Z",
      reviewedAt: "2026-05-15T01:00:00.000Z",
      reviewNote: null,
      rejectionReason: "사업자등록증 이미지가 흐릿합니다.",
    };
    const apiClient: BusinessApiClient = {
      getCurrentUser: async () => mockSession,
      login: async () => mockSession,
      logout: async () => undefined,
      requestPasswordReset: async () => ({ accepted: true }),
      getCurrentRestaurantApplication: async () => rejectedApplication,
      createRestaurantApplication: async () => rejectedApplication,
      updateRestaurantApplication: async () => rejectedApplication,
      uploadBusinessFile: async (purpose, file) => ({
        id: 3002,
        purpose,
        visibility: purpose === "restaurant_image" ? "PUBLIC" : "PRIVATE",
        originalFilename: file.name,
        contentType: file.type,
        byteSize: file.size,
        checksumSha256: null,
        publicUrl: null,
        createdAt: "2026-05-15T00:00:00.000Z",
      }),
      submitRestaurantApplication: async () => rejectedApplication,
      getCurrentRestaurant: async () => mockRestaurant,
      updateRestaurant: async () => mockRestaurant,
    };
    window.history.pushState({}, "", "/onboarding");

    render(<App apiClient={apiClient} />);

    expect(await screen.findByRole("heading", { name: "입점 신청 상태" })).toBeInTheDocument();
    expect(screen.getByText("사업자등록증 이미지가 흐릿합니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "수정 후 재제출" }));

    expect(await screen.findByRole("heading", { name: "입점 신청" })).toBeInTheDocument();
    expect(screen.getByText("반려 사유")).toBeInTheDocument();
  });

  it("updates store settings with a cover image", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "매장 설정" }));

    expect(await screen.findByRole("heading", { name: "매장 설정" })).toBeInTheDocument();
    expect(await screen.findByDisplayValue("청담 본점")).toBeInTheDocument();
    expect(
      await screen.findByText("공개 페이지 기본 정보가 준비되어 있습니다."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("매장명"), {
      target: { value: "청담 리뉴얼 키친" },
    });
    fireEvent.change(screen.getByLabelText("매장 소개"), {
      target: { value: "계절 메뉴 중심의 예약제 레스토랑입니다." },
    });
    fireEvent.change(screen.getByLabelText("매장 전화번호"), {
      target: { value: "02-9876-5432" },
    });
    fireEvent.change(screen.getByLabelText("주소"), {
      target: { value: "서울시 강남구 새길 10" },
    });
    fireEvent.change(screen.getByLabelText("음식 종류"), {
      target: { value: "양식, 와인" },
    });
    fireEvent.change(screen.getByLabelText("대표 이미지"), {
      target: {
        files: [new File(["cover"], "store-cover.png", { type: "image/png" })],
      },
    });

    expect(await screen.findByText("현재 대표 이미지: store-cover.png")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("매장 정보가 저장되었습니다.")).toBeInTheDocument();
  });
});
