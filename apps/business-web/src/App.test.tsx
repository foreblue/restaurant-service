import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  createBusinessApiClient,
  type BusinessApiClient,
  type RestaurantApplicationResponse,
  type ReservationProductResponse,
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

const mockReservationProduct: ReservationProductResponse = {
  id: 1,
  restaurantId: 1,
  name: "디너 코스",
  description: "계절 메뉴 코스",
  priceAmount: 80000,
  visible: true,
  status: "ACTIVE",
  minPartySize: 1,
  maxPartySize: 4,
  availableDays: ["FRIDAY", "SATURDAY"],
  availableStartTime: "18:00",
  availableEndTime: "21:00",
  slotCapacity: 8,
  paymentPolicyType: "NONE",
  paymentAmount: null,
  createdAt: "2026-05-15T00:00:00.000Z",
  updatedAt: "2026-05-15T00:00:00.000Z",
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
      saveBusinessHours: async () => [],
      saveHolidayRules: async () => [],
      updateReservationPage: async () => mockRestaurant.reservationPage!,
      listReservationProducts: async () => [],
      createReservationProduct: async () => mockReservationProduct,
      updateReservationProduct: async () => mockReservationProduct,
      deleteReservationProduct: async () => undefined,
      updateReservationProductPaymentPolicy: async () => ({
        productId: mockReservationProduct.id,
        paymentMode: "NONE",
        depositType: null,
        paymentAmount: null,
        noShowFeeAmount: null,
        updatedAt: "2026-05-15T00:00:00.000Z",
      }),
      saveReservationProductCancellationPolicy: async () => ({
        policyId: "mock-cancel-1",
        productId: mockReservationProduct.id,
        isActive: true,
        name: "기본 취소 정책",
        rules: [],
        noShowRule: {
          refundRate: 0,
          feeAmount: 0,
        },
        updatedAt: "2026-05-15T00:00:00.000Z",
      }),
      saveReservationProductSeatRules: async () => ({
        productId: mockReservationProduct.id,
        allowedSeatTypes: ["HALL"],
        allowedSeatTypeLabels: ["홀"],
        allowedTableIds: [4001],
        allowedTables: [
          {
            id: 4001,
            name: "홀 A1",
            seatTypeLabel: "홀",
            maxPartySize: 2,
            combinationPolicyLabel: "단독 사용",
          },
        ],
        defaultDurationMinutes: 90,
        slotIntervalMinutes: 30,
        tableCombinationSummary: "테이블 조합 가능 범위: 단독 사용 · 단일 테이블 최대 2명",
        summary: "디너 코스: 홀 좌석, 기본 90분, 30분 간격.",
        updatedAt: "2026-05-15T00:00:00.000Z",
      }),
      listBusinessTimeSlots: async () => ({
        date: "2026-05-15",
        summary: {
          totalCount: 0,
          availableCount: 0,
          closedCount: 0,
          tempClosedCount: 0,
          duplicateGuardedCount: 0,
        },
        items: [],
      }),
      closeBusinessTimeSlot: async () => {
        throw new Error("not implemented in this test");
      },
      reopenBusinessTimeSlot: async () => {
        throw new Error("not implemented in this test");
      },
      listBusinessReservations: async () => ({
        date: "2026-05-15",
        from: "2026-05-15",
        to: "2026-05-15",
        summary: {
          totalReservations: 0,
          totalPartySize: 0,
          confirmedCount: 0,
          modifiedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          noShowCount: 0,
        },
        items: [],
      }),
      listBusinessReservationCalendar: async () => ({
        from: "2026-05-15",
        to: "2026-05-15",
        days: [],
      }),
      getBusinessReservationDetail: async () => ({
        id: 1,
        reservationNumber: "RSV-1",
        status: "CONFIRMED",
        statusLabel: "확정",
        statusTone: "success",
        source: "ONLINE",
        reservedStartAt: "2026-05-15T02:30:00.000Z",
        reservedEndAt: "2026-05-15T04:00:00.000Z",
        visitDate: "2026-05-15",
        startTime: "11:30:00",
        endTime: "13:00:00",
        partySize: 2,
        product: {
          id: mockReservationProduct.id,
          name: mockReservationProduct.name,
        },
        customer: {
          id: 1,
          name: "김예약",
          phoneNumber: "010-1234-5678",
          visitCount: 1,
          noShowCount: 0,
        },
        customerRequest: null,
        ownerNote: null,
        paymentStatus: "NOT_REQUIRED",
        paymentActionRequired: false,
        cancelledAt: null,
        cancelReason: null,
        completedAt: null,
        noShowAt: null,
        auditLogs: [],
      }),
      createManualBusinessReservation: async () => ({
        id: 2,
        reservationNumber: "M20260515-1",
        status: "CONFIRMED",
        statusLabel: "확정",
        statusTone: "success",
        source: "MANUAL_PHONE",
        reservedStartAt: "2026-05-15T03:00:00.000Z",
        reservedEndAt: "2026-05-15T04:30:00.000Z",
        visitDate: "2026-05-15",
        startTime: "12:00:00",
        endTime: "13:30:00",
        partySize: 2,
        product: {
          id: mockReservationProduct.id,
          name: mockReservationProduct.name,
        },
        customer: {
          id: 2,
          name: "한전화",
          phoneNumber: "01012345678",
          visitCount: 1,
          noShowCount: 0,
        },
        customerRequest: null,
        ownerNote: null,
        paymentStatus: "OFFLINE",
        paymentActionRequired: false,
        cancelledAt: null,
        cancelReason: null,
        completedAt: null,
        noShowAt: null,
        auditLogs: [],
      }),
      updateBusinessReservation: async () => {
        throw new Error("not implemented in this test");
      },
      cancelBusinessReservation: async () => {
        throw new Error("not implemented in this test");
      },
      completeBusinessReservation: async () => {
        throw new Error("not implemented in this test");
      },
      markBusinessReservationNoShow: async () => {
        throw new Error("not implemented in this test");
      },
      updateBusinessReservationOperationNote: async () => {
        throw new Error("not implemented in this test");
      },
      getBusinessReservationRefundPreview: async () => ({
        reservationId: 1,
        reservationNumber: "RSV-1",
        cancelActor: "RESTAURANT",
        paymentStatus: "NOT_REQUIRED",
        paymentStatusLabel: "결제 없음",
        refundStatus: "NOT_REQUIRED",
        refundStatusLabel: "환불 없음",
        refundStatusTone: "muted",
        paidAmount: 0,
        expectedRefundAmount: 0,
        nonRefundableAmount: 0,
        currency: "KRW",
        policySummary: "결제 금액이 없어 자동 환불 예정 금액이 없습니다.",
        actionRequired: false,
        adminContactRequired: false,
        settlementNotice: "정산금 계산이나 지급 스케줄은 이 화면에서 제공하지 않습니다.",
      }),
      listBusinessTables: async () => ({
        summary: {
          totalCount: 0,
          activeCount: 0,
          totalCapacity: 0,
          roomCount: 0,
        },
        items: [],
      }),
      createBusinessTable: async () => ({
        id: 4001,
        name: "홀 A1",
        seatType: "HALL",
        seatTypeLabel: "홀",
        minPartySize: 1,
        maxPartySize: 2,
        isActive: true,
        combinationPolicy: "NONE",
        combinationPolicyLabel: "단독 사용",
        hasReservations: false,
        updatedAt: "2026-05-15T00:00:00.000Z",
      }),
      updateBusinessTable: async () => ({
        id: 4001,
        name: "홀 A1",
        seatType: "HALL",
        seatTypeLabel: "홀",
        minPartySize: 1,
        maxPartySize: 2,
        isActive: false,
        combinationPolicy: "NONE",
        combinationPolicyLabel: "단독 사용",
        hasReservations: false,
        updatedAt: "2026-05-15T00:00:00.000Z",
      }),
      listBusinessPayments: async () => ({
        summary: {
          totalCount: 0,
          paidAmount: 0,
          cardGuaranteeCount: 0,
          actionRequiredCount: 0,
        },
        items: [],
      }),
      listBusinessRefunds: async () => ({
        summary: {
          totalCount: 0,
          refundAmount: 0,
          failedCount: 0,
          actionRequiredCount: 0,
        },
        items: [],
      }),
      listBusinessCustomers: async () => ({
        summary: {
          totalCount: 0,
          visitedCount: 0,
          noShowCount: 0,
          preferenceCount: 0,
        },
        items: [],
      }),
      getBusinessCustomer: async () => ({
        id: 1,
        name: "김예약",
        phoneNumber: "010-1234-5678",
        phoneMasked: "010-****-5678",
        totalReservations: 1,
        visitCount: 1,
        noShowCount: 0,
        cancelledCount: 0,
        firstReservationAt: "2026-05-15T02:30:00.000Z",
        lastReservationAt: "2026-05-15T02:30:00.000Z",
        lastVisitedAt: null,
        nextReservationAt: "2026-05-15T02:30:00.000Z",
        recentRequests: [],
        allergies: [],
        anniversaries: [],
        privacyNotice: "전화번호는 고객 상세에서만 표시합니다.",
      }),
      listBusinessCustomerReservations: async () => ({ items: [] }),
      listBusinessAuditLogs: async () => ({ items: [] }),
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

    fireEvent.change(screen.getByLabelText("월요일 브레이크 시작"), {
      target: { value: "14:00" },
    });
    fireEvent.change(screen.getByLabelText("월요일 브레이크 종료"), {
      target: { value: "13:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "영업시간/휴무 저장" }));

    expect(
      await screen.findByText("월요일 브레이크 시작은 종료보다 빨라야 합니다."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("월요일 브레이크 종료"), {
      target: { value: "15:00" },
    });
    fireEvent.click(screen.getByLabelText("일요일 전체 휴무"));
    fireEvent.click(screen.getByLabelText("일요일 정기 휴무"));
    fireEvent.click(screen.getByRole("button", { name: "영업시간/휴무 저장" }));

    expect(await screen.findByText("영업시간과 휴무가 저장되었습니다.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("최대 예약 인원"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "정책 저장" }));

    expect(
      await screen.findByText("최소 예약 인원은 최대 예약 인원보다 클 수 없습니다."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("최대 예약 인원"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "정책 저장" }));

    expect(
      await screen.findByText(
        "예약 정책이 화면에 저장되었습니다. 실제 API 연동은 후속 계약에서 연결합니다.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "공개 전환" }));

    expect(await screen.findByText("현재 상태: 공개")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "공유 링크 복사" }));

    expect(await screen.findByText("공유 링크를 복사했습니다.")).toBeInTheDocument();
  });

  it("manages reservation products with the mock adapter", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "예약 상품" }));

    expect(await screen.findByRole("heading", { name: "예약 상품" })).toBeInTheDocument();
    expect(await screen.findByText("등록된 예약 상품이 없습니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "상품 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "상품 저장" }));

    expect(await screen.findByText("상품명을 입력해 주세요.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("상품명"), {
      target: { value: "디너 코스" },
    });
    fireEvent.change(screen.getByLabelText("가격"), {
      target: { value: "80000" },
    });
    fireEvent.change(screen.getByLabelText("상품 설명"), {
      target: { value: "계절 메뉴 코스" },
    });
    fireEvent.change(screen.getByLabelText("최소 인원"), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByLabelText("최대 인원"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "상품 저장" }));

    expect(
      await screen.findByText("최소 인원은 최대 인원보다 클 수 없습니다."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("최소 인원"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("최대 인원"), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByLabelText("예약 가능 시작"), {
      target: { value: "21:00" },
    });
    fireEvent.change(screen.getByLabelText("예약 가능 종료"), {
      target: { value: "18:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "상품 저장" }));

    expect(
      await screen.findByText("예약 가능 시작 시간은 종료 시간보다 빨라야 합니다."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("예약 가능 시작"), {
      target: { value: "18:00" },
    });
    fireEvent.change(screen.getByLabelText("예약 가능 종료"), {
      target: { value: "21:00" },
    });
    fireEvent.change(screen.getByLabelText("슬롯 재고"), {
      target: { value: "8" },
    });
    expect(screen.getByLabelText("월요일 가능")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "상품 저장" }));

    expect(await screen.findByText("상품이 생성되었습니다.")).toBeInTheDocument();
    expect(await screen.findByText("디너 코스")).toBeInTheDocument();
    expect(screen.getByText("80,000원")).toBeInTheDocument();
    expect(screen.getAllByText("노출").length).toBeGreaterThan(0);
    expect(screen.getByText("2-6명")).toBeInTheDocument();
    expect(screen.getByText("18:00-21:00 · 재고 8")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "디너 코스 수정" }));
    expect(await screen.findByLabelText("노쇼 환불율")).toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText("결제 방식"), {
      target: { value: "DEPOSIT" },
    });
    fireEvent.change(screen.getByLabelText("예약금"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "정책 저장" }));

    expect(await screen.findByText("예약금은 1원 이상이어야 합니다.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("예약금"), {
      target: { value: "10000" },
    });
    fireEvent.change(screen.getByLabelText("24시간 전"), {
      target: { value: "120" },
    });
    fireEvent.click(screen.getByRole("button", { name: "정책 저장" }));

    expect(
      await screen.findByText("환불율은 0부터 100 사이 정수로 입력해 주세요."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("24시간 전"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("노쇼 수수료"), {
      target: { value: "30000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "정책 저장" }));

    expect(await screen.findByText("결제/취소 정책이 저장되었습니다.")).toBeInTheDocument();
    expect(screen.getByText(/예약금 10,000원/)).toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText("상품명"), {
      target: { value: "런치 코스" },
    });
    fireEvent.change(screen.getByLabelText("가격"), {
      target: { value: "50000" },
    });
    fireEvent.click(screen.getByLabelText("예약 페이지 노출"));
    fireEvent.click(screen.getByRole("button", { name: "상품 저장" }));

    expect(await screen.findByText("상품이 수정되었습니다.")).toBeInTheDocument();
    expect(await screen.findByText("런치 코스")).toBeInTheDocument();
    expect(screen.getByText("50,000원")).toBeInTheDocument();
    expect(screen.getAllByText("비노출").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "런치 코스 삭제" }));

    expect(await screen.findByRole("dialog", { name: "예약 상품 삭제" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "삭제/비활성화" }));

    expect(await screen.findByText("상품이 삭제되었습니다.")).toBeInTheDocument();
    expect(await screen.findByText("등록된 예약 상품이 없습니다.")).toBeInTheDocument();
  });

  it("closes and reopens time slot inventory with the mock adapter", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "좌석/재고" }));

    expect(
      await screen.findByRole("heading", { name: "시간대별 재고와 임시 마감" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("중복 예약 방지 적용")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("디너 코스").length).toBeGreaterThan(0));
    expect(screen.getByText(/고객 예약 가능 시간 후보에 반영됩니다/)).toBeInTheDocument();

    const closeButton = (await screen.findAllByRole("button", { name: "임시 마감" })).find(
      (button) => !button.hasAttribute("disabled"),
    );

    expect(closeButton).toBeDefined();
    fireEvent.click(closeButton!);

    expect(await screen.findByText(/슬롯을 임시 마감했습니다/)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "마감 해제" }));

    expect(await screen.findByText(/슬롯을 다시 열었습니다/)).toBeInTheDocument();
  });

  it("connects reservation products to seat rules with the mock adapter", async () => {
    const apiClient = createBusinessApiClient();

    apiClient.listReservationProducts = async () => [mockReservationProduct];
    apiClient.saveReservationProductSeatRules = async (_productId, request) => {
      const labels = (request.allowedSeatTypes ?? []).map((seatType) =>
        seatType === "ROOM" ? "룸" : "홀",
      );

      return {
        productId: mockReservationProduct.id,
        allowedSeatTypes: request.allowedSeatTypes ?? [],
        allowedSeatTypeLabels: labels,
        allowedTableIds: request.allowedTableIds ?? [],
        allowedTables: [
          {
            id: 4001,
            name: "홀 A1",
            seatTypeLabel: "홀",
            maxPartySize: 2,
            combinationPolicyLabel: "인접 테이블 조합",
          },
          {
            id: 4003,
            name: "룸 1",
            seatTypeLabel: "룸",
            maxPartySize: 6,
            combinationPolicyLabel: "같은 좌석 유형 조합",
          },
        ],
        defaultDurationMinutes: request.defaultDurationMinutes ?? 90,
        slotIntervalMinutes: request.slotIntervalMinutes ?? 30,
        tableCombinationSummary: "테이블 조합 가능 범위: 인접 테이블 조합, 같은 좌석 유형 조합",
        summary: `디너 코스: ${labels.join(", ")} 좌석, 기본 ${request.defaultDurationMinutes ?? 90}분, ${request.slotIntervalMinutes ?? 30}분 간격.`,
        updatedAt: "2026-05-15T00:00:00.000Z",
      };
    };

    render(<App apiClient={apiClient} />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "좌석/재고" }));

    expect(await screen.findByRole("heading", { name: "상품별 좌석 연결" })).toBeInTheDocument();
    await waitFor(() => {
      const productSelect = document.getElementById("seat-rules-product") as HTMLSelectElement;

      expect(
        Array.from(productSelect.options).some((option) => option.textContent === "디너 코스"),
      ).toBe(true);
    });
    const productSelect = document.getElementById("seat-rules-product") as HTMLSelectElement;
    const productOption = Array.from(productSelect.options).find(
      (option) => option.textContent === "디너 코스",
    );

    fireEvent.change(productSelect, {
      target: { value: productOption?.value ?? "" },
    });

    await waitFor(() => expect(screen.getByLabelText("홀 허용 (2개)")).toBeChecked());
    expect(screen.getByLabelText("룸 허용 (1개)")).toBeChecked();
    expect(screen.getByText("테이블 조합 가능 범위")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("기본 이용 시간"), {
      target: { value: "95" },
    });
    fireEvent.click(screen.getByRole("button", { name: "좌석 연결 저장" }));

    expect(
      await screen.findByText("기본 이용 시간은 슬롯 간격의 배수여야 합니다."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("기본 이용 시간"), {
      target: { value: "120" },
    });
    fireEvent.click(screen.getByRole("button", { name: "좌석 연결 저장" }));

    expect(await screen.findByText("좌석 연결 설정이 저장되었습니다.")).toBeInTheDocument();
    expect(
      await screen.findByText(/디너 코스: 홀, 룸 좌석, 기본 120분, 30분 간격/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/테이블 조합 가능 범위:/).length).toBeGreaterThan(0);
  });

  it("shows reservation list calendar and filters with the mock adapter", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "예약 운영" }));

    expect(await screen.findByRole("heading", { name: "예약 운영" })).toBeInTheDocument();
    expect(await screen.findByText("일별 예약 리스트")).toBeInTheDocument();
    expect(await screen.findByText("주간 캘린더")).toBeInTheDocument();
    expect(await screen.findByText("김예약")).toBeInTheDocument();
    expect(screen.getAllByText("확정").length).toBeGreaterThan(0);
    expect(screen.getByText("총 예약")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "김예약 상세 열기" }));

    expect(await screen.findByRole("heading", { name: "예약 상세" })).toBeInTheDocument();
    expect(screen.getByText("RSV-7001")).toBeInTheDocument();
    expect(await screen.findByText("010-1234-5678")).toBeInTheDocument();
    expect(await screen.findByText("창가 좌석 요청, 알레르기 확인 필요")).toBeInTheDocument();
    expect(screen.getByText("VIP/주의 고객 표시는 CRM 단계에서 연결됩니다.")).toBeInTheDocument();
    expect(screen.getAllByText("변경, 취소, 방문 완료, 노쇼 처리 가능").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "고객의 민감정보, 결제정보, 불필요한 개인정보는 운영 메모에 입력하지 마세요.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("환불 운영 상태")).toBeInTheDocument();
    expect(await screen.findByText("예상 환불")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "매장 취소" }));

    expect(await screen.findByRole("dialog", { name: "예약 취소" })).toBeInTheDocument();
    expect(screen.getByText("취소 환불 영향")).toBeInTheDocument();
    expect(
      screen.getAllByText("매장 취소 시 결제 금액 전액 환불을 기본으로 안내합니다.").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("정산금 계산이나 지급 스케줄은 이 화면에서 제공하지 않습니다.").length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "예약 취소 닫기" }));

    fireEvent.change(screen.getByPlaceholderText("전화 확인 내용, 좌석 배정 참고사항 등"), {
      target: { value: "창가 자리 전화 확인" },
    });
    fireEvent.click(screen.getByRole("button", { name: "운영 메모 저장" }));

    expect(await screen.findByText("운영 메모가 저장되었습니다.")).toBeInTheDocument();
    expect(await screen.findByText("운영 메모 수정")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "예약 변경" }));

    expect(await screen.findByRole("dialog", { name: "예약 변경" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("변경 방문 시간"), {
      target: { value: "12:00" },
    });
    fireEvent.change(screen.getByLabelText("변경 인원"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "변경 저장" }));

    expect(await screen.findByText("예약이 변경되었습니다.")).toBeInTheDocument();
    expect((await screen.findAllByText("변경")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "방문 완료" }));

    expect(await screen.findByRole("dialog", { name: "방문 완료 처리" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "방문 완료 처리" }));

    expect(await screen.findByText("방문 완료 처리되었습니다.")).toBeInTheDocument();
    expect((await screen.findAllByText("방문 완료")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "수동 예약 등록" }));

    expect(await screen.findByRole("dialog", { name: "수동 예약 등록" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("예약 상품"), {
      target: { value: "6001" },
    });
    fireEvent.change(screen.getByLabelText("고객명"), {
      target: { value: "한전화" },
    });
    fireEvent.change(screen.getByLabelText("고객 전화번호"), {
      target: { value: "010-7777-1212" },
    });
    fireEvent.change(screen.getByLabelText("방문 시간"), {
      target: { value: "12:30" },
    });
    fireEvent.change(screen.getByLabelText("인원"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("고객 요청사항"), {
      target: { value: "유아 의자 필요" },
    });
    fireEvent.click(screen.getByRole("button", { name: "등록" }));

    expect(await screen.findByText("수동 예약이 등록되었습니다.")).toBeInTheDocument();
    expect((await screen.findAllByText("한전화")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "매장 취소" }));

    expect(await screen.findByRole("dialog", { name: "예약 취소" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("취소 사유"), {
      target: { value: "매장 점검" },
    });
    fireEvent.click(screen.getByRole("button", { name: "취소 처리" }));

    expect(await screen.findByText("예약이 취소되었습니다.")).toBeInTheDocument();
    expect((await screen.findAllByText("매장 취소")).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("예약번호, 고객명, 연락처, 상품명"), {
      target: { value: "박취소" },
    });

    expect(await screen.findByText("조건에 맞는 예약이 없습니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("취소 예약 포함"));

    expect(await screen.findByText("박취소")).toBeInTheDocument();
    expect(screen.getByText("환불 대기")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "박취소 상세 열기" }));

    expect((await screen.findAllByText("고객 취소")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("환불 처리중")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "필터 초기화" }));
    fireEvent.change(screen.getByLabelText("상품"), {
      target: { value: "6002" },
    });

    expect(await screen.findByText("이수정")).toBeInTheDocument();
    expect(screen.getAllByText("런치 코스").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "이수정 상세 열기" }));
    fireEvent.click(await screen.findByRole("button", { name: "노쇼" }));

    expect(await screen.findByRole("dialog", { name: "노쇼 처리" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("노쇼 사유"), {
      target: { value: "연락 없이 미방문" },
    });
    fireEvent.click(screen.getByLabelText("예약 시작 전 처리 강제"));
    fireEvent.click(screen.getByRole("button", { name: "노쇼 처리" }));

    expect(await screen.findByText("노쇼 처리되었습니다.")).toBeInTheDocument();
    expect((await screen.findAllByText("노쇼")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "월" }));

    expect(await screen.findByRole("heading", { name: "월간 캘린더" })).toBeInTheDocument();
  });

  it("shows payment and refund operations with the mock adapter", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "결제/환불" }));

    expect(await screen.findByRole("heading", { name: "결제/환불 내역" })).toBeInTheDocument();
    expect(await screen.findByText("PAY-9101")).toBeInTheDocument();
    expect(screen.getByText("김예약")).toBeInTheDocument();
    expect(screen.getAllByText("결제 완료").length).toBeGreaterThan(0);
    expect(screen.getAllByText("카드 보증").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "PAY-9101 상세 보기" }));
    expect(await screen.findByRole("heading", { name: "결제 상세" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "결제 상세 닫기" }));

    fireEvent.change(screen.getByLabelText("결제 상태"), {
      target: { value: "CARD_GUARANTEE" },
    });

    expect(await screen.findByText("PAY-9103")).toBeInTheDocument();
    expect(screen.getByText("오민준")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "환불" }));

    expect(await screen.findByText("REF-9201")).toBeInTheDocument();
    expect(screen.getAllByText("환불 처리중").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("환불 상태"), {
      target: { value: "FAILED" },
    });

    expect(await screen.findByText("REF-9203")).toBeInTheDocument();
    expect(screen.getByText("PG 승인 거절")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "REF-9203 상세 보기" }));
    expect(await screen.findByRole("heading", { name: "환불 상세" })).toBeInTheDocument();
    expect(
      screen.getByText("플랫폼 관리자 문의 필요: 환불 실패 또는 보정 대상입니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("정산금 계산이나 지급 스케줄은 이 화면에서 제공하지 않습니다."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "필터 초기화" }));

    expect(await screen.findByText("REF-9202")).toBeInTheDocument();
  });

  it("manages seat tables with the mock adapter", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "좌석/재고" }));

    expect(await screen.findByRole("heading", { name: "테이블/좌석 관리" })).toBeInTheDocument();
    expect(await screen.findByText("홀 A1")).toBeInTheDocument();
    expect(screen.getByText("룸 1")).toBeInTheDocument();
    expect(screen.getByText("활성 수용 인원")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "테이블 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("테이블명을 입력해 주세요.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("테이블명"), {
      target: { value: "테라스 1" },
    });
    fireEvent.change(document.getElementById("table-seat-type") as HTMLSelectElement, {
      target: { value: "TERRACE" },
    });
    fireEvent.change(screen.getByLabelText("최소 수용 인원"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("최대 수용 인원"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(
      await screen.findByText("최소 수용 인원은 최대 수용 인원보다 클 수 없습니다."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("최대 수용 인원"), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByLabelText("테이블 조합 범위"), {
      target: { value: "SAME_TYPE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("테이블이 생성되었습니다.")).toBeInTheDocument();
    expect(await screen.findByText("테라스 1")).toBeInTheDocument();
    expect(screen.getAllByText("테라스").length).toBeGreaterThan(0);
    expect(screen.getByText("5-6명")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "테라스 1 수정" }));
    fireEvent.click(screen.getByLabelText("예약 사용"));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("테이블이 수정되었습니다.")).toBeInTheDocument();
    expect(screen.getAllByText("비활성").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "홀 A2 비활성화" }));

    expect(await screen.findByText("테이블이 비활성화되었습니다.")).toBeInTheDocument();
  });

  it("shows customer list, filters, and reservation history", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "고객 관리" }));

    expect(await screen.findByRole("heading", { name: "고객 관리" })).toBeInTheDocument();
    expect(await screen.findByText("김예약")).toBeInTheDocument();
    expect(screen.getAllByText("010-****-5678").length).toBeGreaterThan(0);
    expect(screen.getByText("목록 연락처 마스킹")).toBeInTheDocument();
    expect(screen.getAllByText(/갑각류/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/결혼기념일/).length).toBeGreaterThan(0);
    expect(
      await screen.findByText(
        "전화번호는 고객 상세에서만 표시하며, 고객 응대와 예약 확인 목적 외 사용하지 않습니다.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("필터"), {
      target: { value: "HAS_NO_SHOW" },
    });

    expect((await screen.findAllByText("오민준")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("노쇼 이력").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("고객 검색"), {
      target: { value: "유제품" },
    });

    expect((await screen.findAllByText("오민준")).length).toBeGreaterThan(0);
    expect(screen.queryByText("김예약")).not.toBeInTheDocument();
  });
});
