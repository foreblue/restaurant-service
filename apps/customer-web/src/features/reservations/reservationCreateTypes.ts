export type PublicReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "MODIFIED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_RESTAURANT"
  | "COMPLETED"
  | "NO_SHOW";

export interface PublicReservationCreateRequest {
  restaurantId: number;
  productId: number;
  visitDate: string;
  startTime: string;
  partySize: number;
  memberId: number;
  customerRequest?: string | null;
  customerEmail?: string | null;
  allergyNote?: string | null;
  anniversaryType?: string | null;
  anniversaryDate?: string | null;
  requestTemplateValues?: string[];
  marketingOptIn?: boolean;
  idempotencyKey?: string;
}

export interface PublicReservationResponse {
  id: number;
  reservationNumber: string;
  status: PublicReservationStatus;
  restaurantId: number;
  productId: number;
  customerId: number;
  memberId: number | null;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerName: string;
  customerPhoneLast4: string;
  customerEmail: string | null;
  allergyNote: string | null;
  anniversaryType: string | null;
  anniversaryDate: string | null;
  requestTemplateValues: string[];
  marketingOptIn: boolean;
  lookupToken: string;
  lookupTokenExpiresAt: string;
}
