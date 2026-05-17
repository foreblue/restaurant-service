import { createPublicApiClient } from "@/shared/api/publicApiClient";

import { buildReservationCreateRequest, createPublicReservation } from "./reservationCreateApi";
import { type ReservationCustomerFormValues } from "./reservationCustomerSchema";
import { type PublicReservationProduct } from "./reservationOptionsTypes";

const product: PublicReservationProduct = {
  id: 10,
  name: "디너 코스",
  description: null,
  displayPrice: 80000,
  minPartySize: 2,
  maxPartySize: 4,
  availableDays: ["FRIDAY"],
  availableStartTime: "18:00",
  availableEndTime: "21:00",
  requiresPayment: false,
  depositAmount: 0,
};

const customerInfo: ReservationCustomerFormValues = {
  allergyNote: "견과류",
  anniversaryDate: "05-17",
  anniversaryType: "BIRTHDAY",
  customerName: "홍길동",
  email: null,
  marketingConsent: false,
  phoneNumber: "01012345678",
  privacyConsent: true,
  requestNotes: "창가 좌석 요청",
  requestTemplateValues: ["조용한 좌석 선호"],
};

describe("reservationCreateApi", () => {
  it("maps selected options and customer info to the backend request", () => {
    expect(
      buildReservationCreateRequest({
        customerInfo,
        idempotencyKey: "idem-1",
        partySize: 2,
        product,
        restaurantId: 1,
        selectedDate: "2026-05-18",
        selectedTimeSlot: {
          timeSlotId: "slot-1",
          startTime: "18:00",
          endTime: "19:30",
          remainingCapacity: 4,
          available: true,
        },
      }),
    ).toEqual({
      allergyNote: "견과류",
      anniversaryDate: "05-17",
      anniversaryType: "BIRTHDAY",
      customerEmail: null,
      customerName: "홍길동",
      customerPhone: "01012345678",
      customerRequest: "창가 좌석 요청",
      idempotencyKey: "idem-1",
      marketingOptIn: false,
      partySize: 2,
      productId: 10,
      requestTemplateValues: ["조용한 좌석 선호"],
      restaurantId: 1,
      startTime: "18:00",
      visitDate: "2026-05-18",
    });
  });

  it("posts a reservation create request with idempotency key", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        headers: { "content-type": "application/json" },
        status: 201,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await createPublicReservation(
      {
        customerName: "홍길동",
        customerPhone: "01012345678",
        idempotencyKey: "idem-1",
        partySize: 2,
        productId: 10,
        restaurantId: 1,
        startTime: "18:00",
        visitDate: "2026-05-18",
      },
      "idem-1",
      client,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservations",
      expect.objectContaining({
        body: expect.stringContaining('"idempotencyKey":"idem-1"'),
        headers: expect.objectContaining({
          "idempotency-key": "idem-1",
        }),
        method: "POST",
      }),
    );
  });
});
