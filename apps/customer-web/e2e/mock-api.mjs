import http from "node:http";

const port = Number(process.argv.at(-1)) || 4181;
const baseDate = "2026-05-18";

let nextReservationId = 300;
let reservations = new Map();
let currentScenario = "default";

function resetState() {
  nextReservationId = 300;
  reservations = new Map();
  currentScenario = "default";
  const seeded = createReservation({
    customerName: "조회고객",
    customerPhone: "01012345678",
    customerRequest: "창가 좌석 요청",
    productId: 10,
    partySize: 2,
    startTime: "18:00",
    visitDate: baseDate,
  });
  seeded.id = 301;
  seeded.reservationNumber = "RSV-LOOKUP-0001";
  seeded.lookupToken = "lookup-token-301";
  reservations.set(seeded.id, seeded);
  nextReservationId = 302;
}

const restaurant = {
  id: 101,
  name: "청담 테스트 다이닝",
  slug: "cheongdam-main",
  description: "공개 예약 플로우 E2E용 매장입니다.",
  phone: "02-555-1212",
  addressLine1: "서울시 강남구 테스트로 17",
  addressLine2: "2층",
  postalCode: "06000",
  cuisineTypes: ["코스", "다이닝"],
  coverImageFileId: null,
  coverImageUrl: null,
  timezone: "Asia/Seoul",
  businessHours: [],
  holidayRules: [],
  reservationPage: {
    status: "PUBLIC",
    publishedAt: "2026-05-01T00:00:00.000Z",
    publicUrl: "http://127.0.0.1:4178/r/cheongdam-main",
    reservationAvailable: true,
  },
};

const products = [
  {
    id: 10,
    name: "디너 코스",
    description: "계절 메뉴 코스",
    displayPrice: 80000,
    minPartySize: 2,
    maxPartySize: 4,
    availableDays: ["MONDAY"],
    availableStartTime: "18:00",
    availableEndTime: "21:00",
    requiresPayment: false,
    depositAmount: 0,
    paymentPolicyType: "FREE",
    paymentAmount: null,
    seatTypes: [
      { code: "HALL", label: "홀" },
      { code: "ROOM", label: "룸" },
    ],
  },
  {
    id: 20,
    name: "예약금 코스",
    description: "예약금 결제 테스트 상품",
    displayPrice: 100000,
    minPartySize: 2,
    maxPartySize: 4,
    availableDays: ["MONDAY"],
    availableStartTime: "18:00",
    availableEndTime: "21:00",
    requiresPayment: true,
    depositAmount: 10000,
    paymentPolicyType: "DEPOSIT",
    paymentAmount: 10000,
    seatTypes: [{ code: "ROOM", label: "룸" }],
  },
];

const longContentRestaurant = {
  ...restaurant,
  name: "청담 테스트 다이닝 프라이빗 셰프 테이블 긴 매장명 검증 지점",
  description:
    "모바일 화면에서 긴 매장 소개와 예약 안내 문구가 자연스럽게 줄바꿈되는지 검증하기 위한 공개 예약 페이지입니다.",
  addressLine1: "서울특별시 강남구 아주긴테헤란로123길 45-67 모바일레이아웃검증빌딩",
  addressLine2: "12층 프라이빗룸과 창가석이 함께 있는 긴 주소 상세",
  cuisineTypes: ["코스 다이닝", "프라이빗 룸", "기념일"],
};

const longContentProducts = products.map((product) =>
  product.id === 10
    ? {
        ...product,
        name: "계절 한정 셰프 테이스팅 디너 코스와 긴 상품명 표시 검증 메뉴",
        description:
          "제철 재료 설명, 알레르기 안내, 기념일 요청까지 포함된 긴 상품 설명이 모바일에서 겹치지 않는지 확인합니다.",
      }
    : {
        ...product,
        name: "예약금 결제가 필요한 프라이빗 룸 코스 긴 상품명",
      },
);

resetState();

const server = http.createServer(async (request, response) => {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader(
    "access-control-allow-headers",
    "accept, content-type, idempotency-key, x-reservation-lookup-token",
  );
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  const body = await readJson(request);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/__mock/reset") {
    resetState();
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/__mock/scenario") {
    if (!["default", "long-content"].includes(body.scenario)) {
      sendJson(
        response,
        { code: "INVALID_SCENARIO", message: "지원하지 않는 시나리오입니다." },
        400,
      );
      return;
    }

    currentScenario = body.scenario;
    sendJson(response, { ok: true, scenario: currentScenario });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/public/restaurants/cheongdam-main") {
    sendJson(response, activeRestaurant());
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === `/api/public/restaurants/${restaurant.id}/reservation-page`
  ) {
    sendJson(response, activeRestaurant());
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === `/api/public/restaurants/${restaurant.id}/reservation-products`
  ) {
    sendJson(response, { products: activeProducts() });
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === `/api/public/restaurants/${restaurant.id}/availability/dates`
  ) {
    sendJson(response, {
      restaurantId: restaurant.id,
      productId: Number(url.searchParams.get("productId") ?? 10),
      from: baseDate,
      to: baseDate,
      dates: [{ date: baseDate, available: true }],
    });
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === `/api/public/restaurants/${restaurant.id}/availability/times`
  ) {
    sendJson(response, {
      restaurantId: restaurant.id,
      productId: Number(url.searchParams.get("productId") ?? 10),
      date: url.searchParams.get("date") ?? baseDate,
      times: [
        {
          timeSlotId: "slot-1800",
          startTime: "18:00",
          endTime: "19:30",
          remainingCapacity: 4,
          available: true,
        },
        {
          timeSlotId: "slot-2000",
          startTime: "20:00",
          endTime: "21:30",
          remainingCapacity: 0,
          available: false,
          unavailableReason: "BLOCKED",
        },
      ],
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/public/reservations") {
    const reservation = createReservation(body);
    reservations.set(reservation.id, reservation);
    sendJson(response, reservation, 201);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/public/reservation-lookup-tokens") {
    const reservation = [...reservations.values()].find(
      (item) =>
        item.reservationNumber === body.reservationNumber &&
        item.customerPhone === String(body.phoneNumber ?? "").replace(/\D/g, ""),
    );

    if (!reservation) {
      sendJson(response, { code: "ACCESS_DENIED", message: "예약 조회 권한이 없습니다." }, 403);
      return;
    }

    sendJson(response, {
      reservationId: reservation.id,
      lookupToken: reservation.lookupToken,
      expiresAt: "2026-05-19T00:00:00.000Z",
    });
    return;
  }

  const reservationMatch = url.pathname.match(/^\/api\/public\/reservations\/(\d+)(.*)$/);
  if (reservationMatch) {
    const reservationId = Number(reservationMatch[1]);
    const suffix = reservationMatch[2] || "";
    const reservation = reservations.get(reservationId);

    if (!reservation) {
      sendJson(response, { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." }, 404);
      return;
    }

    if (request.method === "GET" && suffix === "") {
      sendJson(response, detailResponse(reservation));
      return;
    }

    if (request.method === "GET" && suffix === "/payment-summary") {
      sendJson(response, paymentSummary(reservation));
      return;
    }

    if (request.method === "GET" && suffix === "/refund-preview") {
      sendJson(response, refundPreview(reservation));
      return;
    }

    if (request.method === "POST" && suffix === "/cancel") {
      reservation.status = "CANCELLED_BY_CUSTOMER";
      reservation.cancelable = false;
      reservation.cancelledAt = "2026-05-17T03:00:00.000Z";
      reservation.cancelReason = body.reason ?? null;
      reservation.refund = {
        refundId: 900,
        paymentId: null,
        status: null,
        paymentStatus: "NOT_REQUIRED",
        refundRequired: false,
        refundAmount: 0,
        nonRefundableAmount: 0,
        alreadyRefundedAmount: 0,
        currency: "KRW",
        policyRuleId: null,
        reason: "CUSTOMER_CANCEL",
        message: "환불이 필요한 온라인 결제가 없습니다.",
      };
      sendJson(response, detailResponse(reservation));
      return;
    }

    if (request.method === "POST" && suffix === "/payments") {
      if (reservation.customerName.includes("실패")) {
        sendJson(
          response,
          {
            paymentId: 701,
            status: "FAILED",
            amount: 10000,
            currency: "KRW",
            paymentAction: null,
            expiresAt: null,
          },
          201,
        );
        return;
      }

      sendJson(
        response,
        {
          paymentId: 700,
          status: "PAID",
          amount: 10000,
          currency: "KRW",
          paymentAction: null,
          expiresAt: null,
        },
        201,
      );
      return;
    }
  }

  sendJson(
    response,
    { code: "NOT_FOUND", message: `Unhandled route ${request.method} ${url.pathname}` },
    404,
  );
});

server.listen(port, "127.0.0.1", () => {
  console.log(`customer-web mock API listening on http://127.0.0.1:${port}`);
});

function createReservation(payload) {
  const id = nextReservationId++;
  const customerPhone = String(payload.customerPhone ?? "01012345678").replace(/\D/g, "");

  return {
    id,
    reservationNumber: `RSV-E2E-${String(id).padStart(4, "0")}`,
    status: "CONFIRMED",
    restaurantId: restaurant.id,
    productId: Number(payload.productId ?? 10),
    customerId: 800 + id,
    visitDate: payload.visitDate ?? baseDate,
    startTime: payload.startTime ?? "18:00",
    endTime: "19:30",
    partySize: Number(payload.partySize ?? 2),
    customerName: payload.customerName ?? "홍길동",
    customerPhone,
    customerPhoneLast4: customerPhone.slice(-4),
    customerEmail: payload.customerEmail ?? null,
    customerRequest: payload.customerRequest ?? null,
    allergyNote: payload.allergyNote ?? null,
    anniversaryType: payload.anniversaryType ?? null,
    anniversaryDate: payload.anniversaryDate ?? null,
    requestTemplateValues: payload.requestTemplateValues ?? [],
    marketingOptIn: Boolean(payload.marketingOptIn),
    lookupToken: `lookup-token-${id}`,
    lookupTokenExpiresAt: "2026-05-19T00:00:00.000Z",
    cancelable: true,
    cancelDeadline: "2026-05-18T09:00:00.000Z",
    cancelledAt: null,
    cancelReason: null,
    refund: null,
  };
}

function detailResponse(reservation) {
  return {
    ...reservation,
    restaurantName: activeRestaurant().name,
    productName:
      activeProducts().find((product) => product.id === reservation.productId)?.name ?? "예약 상품",
  };
}

function paymentSummary(reservation) {
  const product = activeProducts().find((item) => item.id === reservation.productId);
  const paymentMode = product?.paymentPolicyType === "DEPOSIT" ? "DEPOSIT" : "FREE";

  return {
    reservationId: reservation.id,
    paymentMode,
    paymentStatus: paymentMode === "DEPOSIT" ? "REQUIRES_PAYMENT" : "NOT_REQUIRED",
    paymentRequired: paymentMode === "DEPOSIT",
    amount: paymentMode === "DEPOSIT" ? 10000 : 0,
    currency: "KRW",
    paymentDueAt: paymentMode === "DEPOSIT" ? "2026-05-17T03:30:00.000Z" : null,
    cancellationPolicySummary: "예약 생성 시점 취소 정책이 적용됩니다.",
  };
}

function activeRestaurant() {
  return currentScenario === "long-content" ? longContentRestaurant : restaurant;
}

function activeProducts() {
  return currentScenario === "long-content" ? longContentProducts : products;
}

function refundPreview(reservation) {
  return {
    reservationId: reservation.id,
    paymentId: null,
    paymentStatus: reservation.productId === 20 ? "REQUIRES_PAYMENT" : "NOT_REQUIRED",
    refundRequired: false,
    refundableAmount: 0,
    nonRefundableAmount: 0,
    alreadyRefundedAmount: 0,
    paidAmount: 0,
    currency: "KRW",
    policyRuleId: null,
    reason: "CUSTOMER_CANCEL",
    message: "환불이 필요한 온라인 결제가 없습니다.",
  };
}

async function readJson(request) {
  if (!["POST", "PUT", "PATCH"].includes(request.method ?? "")) {
    return {};
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}
