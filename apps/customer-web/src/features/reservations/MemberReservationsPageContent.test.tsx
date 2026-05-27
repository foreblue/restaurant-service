import { render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { PublicApiError } from "@/shared/api/apiError";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  clearStoredCustomerMemberId,
  readStoredCustomerMemberId,
  storeCustomerMemberId,
} from "./customerMemberSession";
import { MemberReservationsPageContent } from "./MemberReservationsPageContent";

const pushMock = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");

  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
  };
});

const member = {
  id: 1,
  name: "김민지",
  phoneLast4: "1001",
  email: "minji.member@example.com",
  allergyNote: "갑각류",
  anniversaryType: "BIRTHDAY",
  anniversaryDate: "05-17",
  marketingOptIn: true,
};

function createMockClient({
  memberError = null,
  reservations = [
    {
      id: 300,
      reservationNumber: "R20260530-ABCD",
      status: "CONFIRMED",
      restaurantId: 1,
      restaurantName: "호접몽",
      productId: 10,
      productName: "테라스 딤섬 세트",
      memberId: 1,
      visitDate: "2026-05-30",
      startTime: "13:30:00",
      endTime: "15:00:00",
      partySize: 2,
      paymentRequired: false,
      paymentMode: "PAY_ON_SITE",
      paymentStatus: "PAY_ON_SITE",
      cancelable: true,
    },
  ],
}: {
  memberError?: Error | null;
  reservations?: unknown[];
} = {}): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn((path: string) => {
      if (path === "/api/public/members/1") {
        return memberError ? Promise.reject(memberError) : Promise.resolve(member);
      }

      if (path === "/api/public/members/1/reservations") {
        return Promise.resolve({ reservations });
      }

      return Promise.reject(new Error(`Unhandled path: ${path}`));
    }),
    post: vi.fn(),
    request: vi.fn(),
  };
}

describe("MemberReservationsPageContent", () => {
  beforeEach(() => {
    clearStoredCustomerMemberId();
    pushMock.mockReset();
  });

  it("guides anonymous users to login", async () => {
    render(
      <AppProviders apiClient={createMockClient()}>
        <MemberReservationsPageContent />
      </AppProviders>,
    );

    expect(
      await screen.findByText("사용자 로그인 후 내 예약을 볼 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사용자 로그인" })).toBeInTheDocument();
  });

  it("shows reservations for the logged-in member", async () => {
    const client = createMockClient();
    storeCustomerMemberId(1);

    render(
      <AppProviders apiClient={client}>
        <MemberReservationsPageContent />
      </AppProviders>,
    );

    expect(await screen.findByText("김민지님의 예약")).toBeInTheDocument();
    expect(screen.getByText("호접몽")).toBeInTheDocument();
    expect(screen.getByText("테라스 딤섬 세트")).toBeInTheDocument();
    expect(screen.getByText("2026-05-30 · 13:30:00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /호접몽/ })).toHaveAttribute(
      "href",
      "/reservations/300?memberId=1",
    );
    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith("/api/public/members/1/reservations", {
        cache: "no-store",
      });
    });
  });

  it("shows an empty state for members without reservations", async () => {
    storeCustomerMemberId(1);

    render(
      <AppProviders apiClient={createMockClient({ reservations: [] })}>
        <MemberReservationsPageContent />
      </AppProviders>,
    );

    expect(await screen.findByText("아직 예약 내역이 없습니다.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "예약 가능한 매장 보기" }).at(-1)).toHaveAttribute(
      "href",
      "/reserve",
    );
  });

  it("clears an invalid stored member and asks for login", async () => {
    storeCustomerMemberId(1);

    render(
      <AppProviders
        apiClient={createMockClient({
          memberError: new PublicApiError({
            code: "NOT_FOUND",
            message: "회원을 찾을 수 없습니다.",
            status: 404,
          }),
        })}
      >
        <MemberReservationsPageContent />
      </AppProviders>,
    );

    expect(
      await screen.findByText("사용자 로그인 후 내 예약을 볼 수 있습니다."),
    ).toBeInTheDocument();
    expect(readStoredCustomerMemberId()).toBeNull();
  });
});
