import { QueryClient } from "@tanstack/react-query";

export interface LinkedRestaurant {
  id: number | null;
  status: string;
}

export interface BusinessUser {
  id: number;
  email: string;
  displayName: string;
  role: string;
  status: string;
  restaurant: LinkedRestaurant;
}

export interface BusinessLoginRequest {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetRequestResult {
  accepted: boolean;
  resetToken?: string | null;
  expiresAt?: string | null;
}

export interface RestaurantApplicationSaveRequest {
  restaurantName?: string | null;
  restaurantDescription?: string | null;
  restaurantPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  cuisineTypes?: string[] | null;
  coverImageFileId?: number | null;
  businessRegistrationNo?: string | null;
  businessName?: string | null;
  representativeName?: string | null;
  businessAddress?: string | null;
  businessLicenseFileId?: number | null;
  managerName?: string | null;
  managerPhone?: string | null;
  managerEmail?: string | null;
  contactVerified?: boolean | null;
}

export type BusinessFilePurpose = "business_license" | "restaurant_image";

export interface BusinessFileUploadResponse {
  id: number;
  purpose: BusinessFilePurpose;
  visibility: "PRIVATE" | "PUBLIC";
  originalFilename: string;
  contentType: string;
  byteSize: number;
  checksumSha256: string | null;
  publicUrl: string | null;
  createdAt: string | null;
}

export interface RestaurantApplicationResponse {
  id: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  restaurant: {
    id: number;
    status: string;
    name: string | null;
    slug: string | null;
    description: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    cuisineTypes: string[];
    coverImageFileId: number | null;
    timezone: string;
  };
  businessRegistrationNo: string | null;
  businessName: string | null;
  representativeName: string | null;
  businessAddress: string | null;
  businessLicenseFileId: number | null;
  managerName: string | null;
  managerPhone: string | null;
  managerEmail: string | null;
  contactVerified: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  rejectionReason: string | null;
}

export interface RestaurantSettingsUpdateRequest {
  name?: string | null;
  description?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  cuisineTypes?: string[] | null;
  coverImageFileId?: number | null;
}

export interface ReservationPageSettingsResponse {
  id: number;
  slug: string | null;
  status: "DRAFT" | "PRIVATE" | "PUBLIC" | "DISABLED";
  publishedAt: string | null;
  unpublishedAt: string | null;
  publicUrl: string | null;
  publishable: boolean;
  publishBlockers: string[];
}

export type BusinessDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface BusinessHourSaveItem {
  dayOfWeek: BusinessDayOfWeek;
  opensAt?: string | null;
  closesAt?: string | null;
  closed?: boolean | null;
}

export interface BusinessHoursSaveRequest {
  hours: BusinessHourSaveItem[];
}

export interface BusinessHourResponse {
  id: number;
  dayOfWeek: BusinessDayOfWeek;
  sequence: number;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
}

export type HolidayRuleType =
  | "WEEKLY"
  | "MONTHLY_DATE"
  | "MONTHLY_NTH_WEEKDAY"
  | "TEMPORARY_DATE"
  | "TEMPORARY_TIME";

export interface HolidayRuleSaveItem {
  type: HolidayRuleType;
  dayOfWeek?: BusinessDayOfWeek | null;
  dayOfMonth?: number | null;
  weekOfMonth?: number | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface HolidayRulesSaveRequest {
  rules: HolidayRuleSaveItem[];
}

export interface HolidayRuleResponse {
  id: number;
  type: HolidayRuleType;
  dayOfWeek: BusinessDayOfWeek | null;
  dayOfMonth: number | null;
  weekOfMonth: number | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface ReservationPageSaveRequest {
  slug?: string | null;
  status: "PUBLIC" | "PRIVATE";
}

export interface ReservationProductSaveRequest {
  name?: string | null;
  description?: string | null;
  priceAmount?: number | null;
  visible?: boolean | null;
  minPartySize?: number | null;
  maxPartySize?: number | null;
  availableDays?: BusinessDayOfWeek[] | null;
  availableStartTime?: string | null;
  availableEndTime?: string | null;
  slotCapacity?: number | null;
}

export type ReservationProductPaymentMode = "NONE" | "DEPOSIT" | "PREPAY" | "CARD_GUARANTEE";
export type ReservationProductDepositType = "PER_RESERVATION" | "PER_PERSON";

export interface ReservationProductPaymentPolicyRequest {
  paymentMode: ReservationProductPaymentMode;
  depositType?: ReservationProductDepositType | null;
  paymentAmount?: number | null;
  noShowFeeAmount?: number | null;
}

export interface ReservationProductPaymentPolicyResponse {
  productId: number;
  paymentMode: ReservationProductPaymentMode;
  depositType: ReservationProductDepositType | null;
  paymentAmount: number | null;
  noShowFeeAmount: number | null;
  updatedAt: string | null;
}

export interface CancellationPolicyRuleRequest {
  beforeVisitHours: number;
  refundRate: number;
}

export interface CancellationPolicyNoShowRuleRequest {
  refundRate: number;
  feeAmount: number;
}

export interface ReservationProductCancellationPolicyRequest {
  name: string;
  rules: CancellationPolicyRuleRequest[];
  noShowRule: CancellationPolicyNoShowRuleRequest;
}

export interface ReservationProductCancellationPolicyResponse {
  policyId: string;
  productId: number;
  isActive: boolean;
  name: string;
  rules: CancellationPolicyRuleRequest[];
  noShowRule: CancellationPolicyNoShowRuleRequest;
  updatedAt: string | null;
}

export interface ReservationProductResponse {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  priceAmount: number;
  visible: boolean;
  status: "ACTIVE" | "DELETED";
  minPartySize: number;
  maxPartySize: number;
  availableDays: BusinessDayOfWeek[];
  availableStartTime: string | null;
  availableEndTime: string | null;
  slotCapacity: number;
  paymentPolicyType: ReservationProductPaymentMode;
  paymentAmount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type BusinessReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "MODIFIED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_RESTAURANT"
  | "COMPLETED"
  | "NO_SHOW";

export type BusinessReservationSource =
  | "ONLINE"
  | "MANUAL_PHONE"
  | "MANUAL_WALK_IN"
  | "OWNER_ADJUSTED";

export interface BusinessReservationListQuery {
  date?: string | null;
  from?: string | null;
  to?: string | null;
  status?: BusinessReservationStatus | null;
  productId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  query?: string | null;
  includeCancelled?: boolean | null;
}

export interface BusinessReservationCalendarQuery {
  from?: string | null;
  to?: string | null;
  status?: BusinessReservationStatus | null;
  productId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface BusinessReservationSummaryResponse {
  totalReservations: number;
  totalPartySize: number;
  confirmedCount: number;
  modifiedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
}

export interface BusinessReservationCustomerSummaryResponse {
  id: number;
  name: string;
  phoneMasked: string;
}

export interface BusinessReservationListItemResponse {
  id: number;
  reservationNumber: string;
  status: BusinessReservationStatus;
  statusLabel: string;
  statusTone: string;
  source: BusinessReservationSource;
  reservedStartAt: string;
  reservedEndAt: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  productId: number;
  productName: string;
  customer: BusinessReservationCustomerSummaryResponse;
  hasCustomerRequest: boolean;
  hasOwnerNote: boolean;
  paymentStatus: string;
  paymentActionRequired: boolean;
}

export interface BusinessReservationListResponse {
  date: string | null;
  from: string;
  to: string;
  summary: BusinessReservationSummaryResponse;
  items: BusinessReservationListItemResponse[];
}

export interface BusinessReservationCalendarDayResponse {
  date: string;
  isOpen: boolean;
  reservationCount: number;
  partySizeTotal: number;
  confirmedCount: number;
  modifiedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
}

export interface BusinessReservationCalendarResponse {
  from: string;
  to: string;
  days: BusinessReservationCalendarDayResponse[];
}

export interface BusinessReservationProductSummaryResponse {
  id: number;
  name: string;
}

export interface BusinessReservationCustomerDetailResponse {
  id: number;
  name: string;
  phoneNumber: string;
  visitCount: number;
  noShowCount: number;
}

export interface BusinessReservationAuditLogResponse {
  id: number;
  action: string;
  createdAt: string | null;
}

export interface BusinessReservationDetailResponse {
  id: number;
  reservationNumber: string;
  status: BusinessReservationStatus;
  statusLabel: string;
  statusTone: string;
  source: BusinessReservationSource;
  reservedStartAt: string;
  reservedEndAt: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  product: BusinessReservationProductSummaryResponse;
  customer: BusinessReservationCustomerDetailResponse;
  customerRequest: string | null;
  ownerNote: string | null;
  paymentStatus: string;
  paymentActionRequired: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  noShowAt: string | null;
  auditLogs: BusinessReservationAuditLogResponse[];
}

export type BusinessManualReservationSource = "MANUAL_PHONE" | "MANUAL_WALK_IN";

export interface BusinessManualReservationCreateRequest {
  source?: BusinessManualReservationSource | null;
  productId?: number | null;
  visitDate?: string | null;
  startTime?: string | null;
  partySize?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerRequest?: string | null;
}

export interface BusinessReservationUpdateRequest {
  productId?: number | null;
  visitDate?: string | null;
  startTime?: string | null;
  partySize?: number | null;
}

export interface BusinessReservationCancelRequest {
  reason?: string | null;
}

export interface BusinessReservationNoShowRequest {
  reason?: string | null;
  force?: boolean | null;
}

export interface RestaurantSettingsResponse {
  id: number;
  status: "DRAFT" | "APPROVAL_REQUESTED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  name: string | null;
  slug: string | null;
  description: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  cuisineTypes: string[];
  coverImageFileId: number | null;
  timezone: string;
  approvedAt: string | null;
  reservationPage: ReservationPageSettingsResponse | null;
  businessHours: BusinessHourResponse[];
  holidayRules: HolidayRuleResponse[];
}

interface BusinessLoginResponse {
  user: BusinessUser;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedApiError extends ApiError {
  constructor(message = "인증이 필요합니다.") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedApiError";
  }
}

export interface BusinessApiClient {
  getCurrentUser(): Promise<BusinessUser>;
  login(request: BusinessLoginRequest): Promise<BusinessUser>;
  logout(): Promise<void>;
  requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetRequestResult>;
  getCurrentRestaurantApplication(): Promise<RestaurantApplicationResponse | null>;
  createRestaurantApplication(
    request: RestaurantApplicationSaveRequest,
  ): Promise<RestaurantApplicationResponse>;
  updateRestaurantApplication(
    applicationId: number,
    request: RestaurantApplicationSaveRequest,
  ): Promise<RestaurantApplicationResponse>;
  uploadBusinessFile(purpose: BusinessFilePurpose, file: File): Promise<BusinessFileUploadResponse>;
  submitRestaurantApplication(applicationId: number): Promise<RestaurantApplicationResponse>;
  getCurrentRestaurant(): Promise<RestaurantSettingsResponse>;
  updateRestaurant(
    restaurantId: number,
    request: RestaurantSettingsUpdateRequest,
  ): Promise<RestaurantSettingsResponse>;
  saveBusinessHours(
    restaurantId: number,
    request: BusinessHoursSaveRequest,
  ): Promise<BusinessHourResponse[]>;
  saveHolidayRules(
    restaurantId: number,
    request: HolidayRulesSaveRequest,
  ): Promise<HolidayRuleResponse[]>;
  updateReservationPage(
    restaurantId: number,
    request: ReservationPageSaveRequest,
  ): Promise<ReservationPageSettingsResponse>;
  listReservationProducts(): Promise<ReservationProductResponse[]>;
  createReservationProduct(
    request: ReservationProductSaveRequest,
  ): Promise<ReservationProductResponse>;
  updateReservationProduct(
    productId: number,
    request: ReservationProductSaveRequest,
  ): Promise<ReservationProductResponse>;
  deleteReservationProduct(productId: number): Promise<void>;
  updateReservationProductPaymentPolicy(
    productId: number,
    request: ReservationProductPaymentPolicyRequest,
  ): Promise<ReservationProductPaymentPolicyResponse>;
  saveReservationProductCancellationPolicy(
    productId: number,
    request: ReservationProductCancellationPolicyRequest,
  ): Promise<ReservationProductCancellationPolicyResponse>;
  listBusinessReservations(
    query: BusinessReservationListQuery,
  ): Promise<BusinessReservationListResponse>;
  listBusinessReservationCalendar(
    query: BusinessReservationCalendarQuery,
  ): Promise<BusinessReservationCalendarResponse>;
  getBusinessReservationDetail(reservationId: number): Promise<BusinessReservationDetailResponse>;
  createManualBusinessReservation(
    request: BusinessManualReservationCreateRequest,
  ): Promise<BusinessReservationDetailResponse>;
  updateBusinessReservation(
    reservationId: number,
    request: BusinessReservationUpdateRequest,
  ): Promise<BusinessReservationDetailResponse>;
  cancelBusinessReservation(
    reservationId: number,
    request: BusinessReservationCancelRequest,
  ): Promise<BusinessReservationDetailResponse>;
  completeBusinessReservation(reservationId: number): Promise<BusinessReservationDetailResponse>;
  markBusinessReservationNoShow(
    reservationId: number,
    request: BusinessReservationNoShowRequest,
  ): Promise<BusinessReservationDetailResponse>;
}

export function createBusinessQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof UnauthorizedApiError) {
            return false;
          }

          return failureCount < 1;
        },
      },
    },
  });
}

class HttpBusinessApiClient implements BusinessApiClient {
  constructor(private readonly baseUrl: string) {}

  getCurrentUser() {
    return this.request<BusinessUser>("/api/business/me");
  }

  async login(request: BusinessLoginRequest) {
    const response = await this.request<BusinessLoginResponse>("/api/business/auth/login", {
      method: "POST",
      body: request,
    });

    return response.user;
  }

  async logout() {
    await this.request<void>("/api/business/auth/logout", {
      method: "POST",
    });
  }

  requestPasswordReset(request: PasswordResetRequest) {
    return this.request<PasswordResetRequestResult>("/api/business/auth/password-reset-requests", {
      method: "POST",
      body: request,
    });
  }

  async getCurrentRestaurantApplication() {
    try {
      return await this.request<RestaurantApplicationResponse>(
        "/api/business/restaurant-applications/current",
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  createRestaurantApplication(request: RestaurantApplicationSaveRequest) {
    return this.request<RestaurantApplicationResponse>("/api/business/restaurant-applications", {
      method: "POST",
      body: request,
    });
  }

  updateRestaurantApplication(applicationId: number, request: RestaurantApplicationSaveRequest) {
    return this.request<RestaurantApplicationResponse>(
      `/api/business/restaurant-applications/${applicationId}`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  uploadBusinessFile(purpose: BusinessFilePurpose, file: File) {
    const formData = new FormData();
    formData.append("purpose", purpose);
    formData.append("file", file);

    return this.request<BusinessFileUploadResponse>("/api/business/files", {
      method: "POST",
      body: formData,
    });
  }

  submitRestaurantApplication(applicationId: number) {
    return this.request<RestaurantApplicationResponse>(
      `/api/business/restaurant-applications/${applicationId}/submit`,
      {
        method: "POST",
      },
    );
  }

  getCurrentRestaurant() {
    return this.request<RestaurantSettingsResponse>("/api/business/restaurants/current");
  }

  updateRestaurant(restaurantId: number, request: RestaurantSettingsUpdateRequest) {
    return this.request<RestaurantSettingsResponse>(`/api/business/restaurants/${restaurantId}`, {
      method: "PUT",
      body: request,
    });
  }

  saveBusinessHours(restaurantId: number, request: BusinessHoursSaveRequest) {
    return this.request<BusinessHourResponse[]>(
      `/api/business/restaurants/${restaurantId}/business-hours`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  saveHolidayRules(restaurantId: number, request: HolidayRulesSaveRequest) {
    return this.request<HolidayRuleResponse[]>(
      `/api/business/restaurants/${restaurantId}/holiday-rules`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  updateReservationPage(restaurantId: number, request: ReservationPageSaveRequest) {
    return this.request<ReservationPageSettingsResponse>(
      `/api/business/restaurants/${restaurantId}/reservation-page`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  listReservationProducts() {
    return this.request<ReservationProductResponse[]>("/api/business/reservation-products");
  }

  createReservationProduct(request: ReservationProductSaveRequest) {
    return this.request<ReservationProductResponse>("/api/business/reservation-products", {
      method: "POST",
      body: request,
    });
  }

  updateReservationProduct(productId: number, request: ReservationProductSaveRequest) {
    return this.request<ReservationProductResponse>(
      `/api/business/reservation-products/${productId}`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  async deleteReservationProduct(productId: number) {
    await this.request<void>(`/api/business/reservation-products/${productId}`, {
      method: "DELETE",
    });
  }

  updateReservationProductPaymentPolicy(
    productId: number,
    request: ReservationProductPaymentPolicyRequest,
  ) {
    return this.request<ReservationProductPaymentPolicyResponse>(
      `/api/business/reservation-products/${productId}/payment-policy`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  saveReservationProductCancellationPolicy(
    productId: number,
    request: ReservationProductCancellationPolicyRequest,
  ) {
    return this.request<ReservationProductCancellationPolicyResponse>(
      `/api/business/reservation-products/${productId}/cancellation-policy`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  listBusinessReservations(query: BusinessReservationListQuery) {
    return this.request<BusinessReservationListResponse>(
      `/api/business/reservations${queryString(query)}`,
    );
  }

  listBusinessReservationCalendar(query: BusinessReservationCalendarQuery) {
    return this.request<BusinessReservationCalendarResponse>(
      `/api/business/reservations/calendar${queryString(query)}`,
    );
  }

  getBusinessReservationDetail(reservationId: number) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}`,
    );
  }

  createManualBusinessReservation(request: BusinessManualReservationCreateRequest) {
    return this.request<BusinessReservationDetailResponse>("/api/business/reservations/manual", {
      method: "POST",
      body: request,
    });
  }

  updateBusinessReservation(reservationId: number, request: BusinessReservationUpdateRequest) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  cancelBusinessReservation(reservationId: number, request: BusinessReservationCancelRequest) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}/cancel`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  completeBusinessReservation(reservationId: number) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}/complete`,
      {
        method: "POST",
      },
    );
  }

  markBusinessReservationNoShow(reservationId: number, request: BusinessReservationNoShowRequest) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}/no-show`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  private async request<T>(path: string, init: { method?: string; body?: unknown } = {}) {
    const requestInit: RequestInit = {
      method: init.method ?? "GET",
      credentials: "include",
    };

    if (typeof FormData !== "undefined" && init.body instanceof FormData) {
      requestInit.body = init.body;
    } else if (init.body !== undefined) {
      requestInit.headers = { "Content-Type": "application/json" };
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, requestInit);

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);

      if (response.status === 401) {
        throw new UnauthorizedApiError(errorBody.message);
      }

      throw new ApiError(
        errorBody.message ?? "요청을 처리하지 못했습니다.",
        response.status,
        errorBody.code,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

class MockBusinessApiClient implements BusinessApiClient {
  private readonly storageKey = "restaurant-business-web.mock-session";
  private readonly applicationStorageKey = "restaurant-business-web.mock-application";
  private readonly restaurantStorageKey = "restaurant-business-web.mock-restaurant";
  private readonly reservationProductsStorageKey =
    "restaurant-business-web.mock-reservation-products";
  private readonly manualReservationsStorageKey =
    "restaurant-business-web.mock-manual-reservations";
  private readonly reservationOverridesStorageKey =
    "restaurant-business-web.mock-reservation-overrides";
  private memoryUser: BusinessUser | null = null;
  private memoryApplication: RestaurantApplicationResponse | null = null;
  private memoryRestaurant: RestaurantSettingsResponse | null = null;
  private memoryReservationProducts: ReservationProductResponse[] | null = null;
  private memoryManualReservations: BusinessReservationListItemResponse[] | null = null;
  private memoryReservationOverrides: BusinessReservationListItemResponse[] | null = null;
  private nextFileId = 3001;

  async getCurrentUser() {
    const user = this.readUser();

    if (!user) {
      throw new UnauthorizedApiError();
    }

    return user;
  }

  async login(request: BusinessLoginRequest) {
    if (!request.email.trim() || !request.password.trim()) {
      throw new ApiError("이메일과 비밀번호를 입력해 주세요.", 400, "INVALID_LOGIN_REQUEST");
    }

    if (request.email === "invalid@example.com") {
      throw new UnauthorizedApiError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const user: BusinessUser = {
      id: 1,
      email: request.email,
      displayName: "청담 본점 오너",
      role: "OWNER",
      status: "ACTIVE",
      restaurant: {
        id: 1,
        status: "APPROVED",
      },
    };

    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.storageKey, JSON.stringify(user));
    } else {
      this.memoryUser = user;
    }

    return user;
  }

  async logout() {
    getBrowserStorage()?.removeItem(this.storageKey);
    this.memoryUser = null;
  }

  async requestPasswordReset(request: PasswordResetRequest) {
    if (!request.email.trim()) {
      throw new ApiError("이메일을 입력해 주세요.", 400, "INVALID_PASSWORD_RESET_REQUEST");
    }

    return {
      accepted: true,
      resetToken: null,
      expiresAt: null,
    };
  }

  async getCurrentRestaurantApplication() {
    return this.readApplication();
  }

  async createRestaurantApplication(request: RestaurantApplicationSaveRequest) {
    const application = toMockApplication(1001, request);
    this.writeApplication(application);
    return application;
  }

  async updateRestaurantApplication(
    applicationId: number,
    request: RestaurantApplicationSaveRequest,
  ) {
    const previous = this.readApplication();
    const application = toMockApplication(applicationId, {
      ...fromApplication(previous),
      ...request,
    });
    this.writeApplication(application);
    return application;
  }

  async uploadBusinessFile(purpose: BusinessFilePurpose, file: File) {
    return {
      id: this.nextFileId++,
      purpose,
      visibility: purpose === "restaurant_image" ? "PUBLIC" : "PRIVATE",
      originalFilename: file.name,
      contentType: file.type || "application/octet-stream",
      byteSize: file.size,
      checksumSha256: null,
      publicUrl: purpose === "restaurant_image" ? `mock://business-files/${file.name}` : null,
      createdAt: new Date().toISOString(),
    } satisfies BusinessFileUploadResponse;
  }

  async submitRestaurantApplication(applicationId: number) {
    const application = this.readApplication();

    if (!application || application.id !== applicationId) {
      throw new ApiError("입점 신청을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const missing = submissionMissingFields(application);

    if (missing.length > 0) {
      throw new ApiError(
        `승인 요청 필수 정보가 부족합니다: ${missing.join(", ")}`,
        400,
        "VALIDATION_ERROR",
      );
    }

    const submitted: RestaurantApplicationResponse = {
      ...application,
      status: "SUBMITTED",
      contactVerified: true,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: null,
      rejectionReason: null,
      restaurant: {
        ...application.restaurant,
        status: "APPROVAL_REQUESTED",
      },
    };
    this.writeApplication(submitted);
    return submitted;
  }

  async getCurrentRestaurant() {
    return this.readRestaurant() ?? defaultMockRestaurant();
  }

  async updateRestaurant(restaurantId: number, request: RestaurantSettingsUpdateRequest) {
    const previous = this.readRestaurant() ?? defaultMockRestaurant();

    if (previous.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const updated: RestaurantSettingsResponse = {
      ...previous,
      name: request.name ?? null,
      description: request.description ?? null,
      phone: request.phone ?? null,
      addressLine1: request.addressLine1 ?? null,
      addressLine2: request.addressLine2 ?? null,
      postalCode: request.postalCode ?? null,
      cuisineTypes: request.cuisineTypes ?? [],
      coverImageFileId: request.coverImageFileId ?? null,
    };
    this.writeRestaurant(updated);
    return updated;
  }

  async saveBusinessHours(restaurantId: number, request: BusinessHoursSaveRequest) {
    const restaurant = this.readRestaurant() ?? defaultMockRestaurant();

    if (restaurant.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const businessHours = request.hours.map((item, index) => ({
      id: 4000 + index + 1,
      dayOfWeek: item.dayOfWeek,
      sequence: index + 1,
      opensAt: item.opensAt ?? null,
      closesAt: item.closesAt ?? null,
      closed: item.closed ?? false,
    }));
    this.writeRestaurant({ ...restaurant, businessHours });
    return businessHours;
  }

  async saveHolidayRules(restaurantId: number, request: HolidayRulesSaveRequest) {
    const restaurant = this.readRestaurant() ?? defaultMockRestaurant();

    if (restaurant.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const holidayRules = request.rules.map((item, index) => ({
      id: 5000 + index + 1,
      type: item.type,
      dayOfWeek: item.dayOfWeek ?? null,
      dayOfMonth: item.dayOfMonth ?? null,
      weekOfMonth: item.weekOfMonth ?? null,
      date: item.date ?? null,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      reason: item.reason ?? null,
    }));
    this.writeRestaurant({ ...restaurant, holidayRules });
    return holidayRules;
  }

  async updateReservationPage(restaurantId: number, request: ReservationPageSaveRequest) {
    const restaurant = this.readRestaurant() ?? defaultMockRestaurant();

    if (restaurant.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const slug = request.slug?.trim() || restaurant.slug || "cheongdam-main";
    const blockers = reservationPageBlockers(restaurant, slug);

    if (request.status === "PUBLIC" && blockers.length > 0) {
      throw new ApiError(
        `예약 페이지를 공개할 수 없습니다: ${blockers.join(", ")}`,
        400,
        "VALIDATION_ERROR",
      );
    }

    const page: ReservationPageSettingsResponse = {
      id: restaurant.reservationPage?.id ?? 1,
      slug,
      status: request.status,
      publishedAt: request.status === "PUBLIC" ? new Date().toISOString() : null,
      unpublishedAt: request.status === "PRIVATE" ? new Date().toISOString() : null,
      publicUrl: `/r/${slug}`,
      publishable: blockers.length === 0,
      publishBlockers: blockers,
    };
    this.writeRestaurant({ ...restaurant, slug, reservationPage: page });
    return page;
  }

  async listReservationProducts() {
    return sortMockReservationProducts(
      this.readReservationProducts().filter((product) => product.status === "ACTIVE"),
    );
  }

  async createReservationProduct(request: ReservationProductSaveRequest) {
    const products = this.readReservationProducts();
    const product = toMockReservationProduct(nextReservationProductId(products), request);
    this.writeReservationProducts(sortMockReservationProducts([...products, product]));
    return product;
  }

  async updateReservationProduct(productId: number, request: ReservationProductSaveRequest) {
    const products = this.readReservationProducts();
    const current = products.find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const updated = toMockReservationProduct(productId, request, current);
    this.writeReservationProducts(
      sortMockReservationProducts(
        products.map((product) => (product.id === productId ? updated : product)),
      ),
    );
    return updated;
  }

  async deleteReservationProduct(productId: number) {
    const products = this.readReservationProducts();
    const current = products.find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const deleted: ReservationProductResponse = {
      ...current,
      visible: false,
      status: "DELETED",
      updatedAt: new Date().toISOString(),
    };
    this.writeReservationProducts(
      products.map((product) => (product.id === productId ? deleted : product)),
    );
  }

  async updateReservationProductPaymentPolicy(
    productId: number,
    request: ReservationProductPaymentPolicyRequest,
  ) {
    const products = this.readReservationProducts();
    const current = products.find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const policy = normalizePaymentPolicy(productId, request, current);
    const updated: ReservationProductResponse = {
      ...current,
      paymentPolicyType: policy.paymentMode,
      paymentAmount: policy.paymentAmount,
      updatedAt: policy.updatedAt,
    };
    this.writeReservationProducts(
      sortMockReservationProducts(
        products.map((product) => (product.id === productId ? updated : product)),
      ),
    );
    return policy;
  }

  async saveReservationProductCancellationPolicy(
    productId: number,
    request: ReservationProductCancellationPolicyRequest,
  ) {
    const current = this.readReservationProducts().find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const name = request.name.trim();
    const rules = request.rules.map((rule) => ({
      beforeVisitHours: rule.beforeVisitHours,
      refundRate: rule.refundRate,
    }));
    const noShowRule = {
      refundRate: request.noShowRule.refundRate,
      feeAmount: request.noShowRule.feeAmount,
    };

    if (!name) {
      throw new ApiError("취소 정책명을 입력해 주세요.", 400, "VALIDATION_ERROR");
    }

    rules.forEach((rule) => validateRefundRate(rule.refundRate));
    validateRefundRate(noShowRule.refundRate);

    if (!Number.isInteger(noShowRule.feeAmount) || noShowRule.feeAmount < 0) {
      throw new ApiError("노쇼 수수료는 0 이상 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
    }

    return {
      policyId: `mock-cancel-${productId}`,
      productId,
      isActive: true,
      name,
      rules,
      noShowRule,
      updatedAt: new Date().toISOString(),
    } satisfies ReservationProductCancellationPolicyResponse;
  }

  async listBusinessReservations(query: BusinessReservationListQuery) {
    const date = query.date ?? todayDateString();
    const from = query.from ?? date;
    const to = query.to ?? date;
    const items = filterMockBusinessReservations(this.readBusinessReservations(), {
      ...query,
      date,
      from,
      to,
    });

    return {
      date,
      from,
      to,
      summary: toBusinessReservationSummary(items),
      items,
    } satisfies BusinessReservationListResponse;
  }

  async listBusinessReservationCalendar(query: BusinessReservationCalendarQuery) {
    const from = query.from ?? firstDayOfMonth(todayDateString());
    const to = query.to ?? lastDayOfMonth(from);
    const filtered = filterMockBusinessReservations(this.readBusinessReservations(), {
      ...query,
      from,
      to,
      includeCancelled: true,
    });

    return {
      from,
      to,
      days: eachDate(from, to).map((date) => {
        const items = filtered.filter((reservation) => reservation.visitDate === date);

        return {
          date,
          isOpen: true,
          reservationCount: items.length,
          partySizeTotal: items.reduce((total, item) => total + item.partySize, 0),
          confirmedCount: items.filter((item) => item.status === "CONFIRMED").length,
          modifiedCount: items.filter((item) => item.status === "MODIFIED").length,
          completedCount: items.filter((item) => item.status === "COMPLETED").length,
          cancelledCount: items.filter(isCancelledReservation).length,
          noShowCount: items.filter((item) => item.status === "NO_SHOW").length,
        };
      }),
    } satisfies BusinessReservationCalendarResponse;
  }

  async getBusinessReservationDetail(reservationId: number) {
    const reservation = this.readBusinessReservations().find((item) => item.id === reservationId);

    if (!reservation) {
      throw new ApiError("예약을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    return toMockBusinessReservationDetail(reservation);
  }

  async createManualBusinessReservation(request: BusinessManualReservationCreateRequest) {
    const normalized = normalizeManualReservationRequest(request);
    const product = this.findMockReservationProduct(normalized.productId);

    if (!product) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (normalized.startTime < "10:00:00" || normalized.startTime >= "22:00:00") {
      throw new ApiError("예약 가능한 시간이 아닙니다.", 409, "CONFLICT");
    }
    if (normalized.partySize > product.maxPartySize) {
      throw new ApiError("예약 가능한 재고가 없습니다.", 409, "CONFLICT");
    }

    const manualReservations = this.readManualReservations();
    const reservation = toMockBusinessReservation({
      id: nextBusinessReservationId([...defaultMockBusinessReservations(), ...manualReservations]),
      reservationNumber: `M${normalized.visitDate.replaceAll("-", "")}-${manualReservations.length + 1}`,
      status: "CONFIRMED",
      source: normalized.source,
      visitDate: normalized.visitDate,
      startTime: normalized.startTime,
      endTime: addMinutes(normalized.startTime, 90),
      partySize: normalized.partySize,
      productId: product.id,
      productName: product.name,
      customerId: 9000 + manualReservations.length + 1,
      customerName: normalized.customerName,
      phoneMasked: maskPhoneNumber(normalized.customerPhone),
      hasCustomerRequest: Boolean(normalized.customerRequest),
      hasOwnerNote: false,
      paymentStatus: "OFFLINE",
      paymentActionRequired: false,
    });

    this.writeManualReservations(
      sortMockBusinessReservations([...manualReservations, reservation]),
    );
    return toMockBusinessReservationDetail(reservation, {
      customerPhone: normalized.customerPhone,
      customerRequest: normalized.customerRequest,
    });
  }

  async updateBusinessReservation(
    reservationId: number,
    request: BusinessReservationUpdateRequest,
  ) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    const normalized = normalizeBusinessReservationUpdateRequest(request, reservation);
    const product = this.findMockReservationProduct(normalized.productId);

    if (!product) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (normalized.startTime < "10:00:00" || normalized.startTime >= "22:00:00") {
      throw new ApiError("예약 가능한 시간이 아닙니다.", 409, "CONFLICT");
    }
    if (normalized.partySize > product.maxPartySize) {
      throw new ApiError("예약 가능한 재고가 없습니다.", 409, "CONFLICT");
    }

    const updatedReservation = patchMockBusinessReservation(reservation, {
      status: "MODIFIED",
      visitDate: normalized.visitDate,
      startTime: normalized.startTime,
      endTime: addMinutes(normalized.startTime, 90),
      partySize: normalized.partySize,
      productId: product.id,
      productName: product.name,
    });

    this.writeBusinessReservation(updatedReservation);
    return toMockBusinessReservationDetail(updatedReservation);
  }

  async cancelBusinessReservation(
    reservationId: number,
    request: BusinessReservationCancelRequest,
  ) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    const reason = normalizeBusinessReservationCancelRequest(request);
    const cancelledReservation = patchMockBusinessReservation(reservation, {
      status: "CANCELLED_BY_RESTAURANT",
    });

    this.writeBusinessReservation(cancelledReservation);
    return toMockBusinessReservationDetail(cancelledReservation, {
      cancelReason: reason,
    });
  }

  async completeBusinessReservation(reservationId: number) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    const completedReservation = patchMockBusinessReservation(reservation, {
      status: "COMPLETED",
    });

    this.writeBusinessReservation(completedReservation);
    return toMockBusinessReservationDetail(completedReservation);
  }

  async markBusinessReservationNoShow(
    reservationId: number,
    request: BusinessReservationNoShowRequest,
  ) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    normalizeBusinessReservationNoShowRequest(request);
    const noShowReservation = patchMockBusinessReservation(reservation, {
      status: "NO_SHOW",
    });

    this.writeBusinessReservation(noShowReservation);
    return toMockBusinessReservationDetail(noShowReservation);
  }

  private readBusinessReservations() {
    const overrides = new Map(
      this.readReservationOverrides().map((reservation) => [reservation.id, reservation]),
    );

    return [...defaultMockBusinessReservations(), ...this.readManualReservations()].map(
      (reservation) => overrides.get(reservation.id) ?? reservation,
    );
  }

  private findMockBusinessReservationForAction(reservationId: number) {
    const reservation = this.readBusinessReservations().find((item) => item.id === reservationId);

    if (!reservation) {
      throw new ApiError("예약을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (!isActionableBusinessReservation(reservation.status)) {
      throw new ApiError("현재 상태에서는 처리할 수 없는 예약입니다.", 409, "CONFLICT");
    }

    return reservation;
  }

  private findMockReservationProduct(productId: number) {
    const product = this.readReservationProducts().find(
      (item) => item.id === productId && item.status === "ACTIVE",
    );

    if (product) {
      return {
        id: product.id,
        name: product.name,
        maxPartySize: product.maxPartySize,
      };
    }

    return defaultMockReservationProducts().find((item) => item.id === productId) ?? null;
  }

  private readManualReservations() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryManualReservations ?? [];
    }

    const raw = storage.getItem(this.manualReservationsStorageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as BusinessReservationListItemResponse[];
    } catch {
      storage.removeItem(this.manualReservationsStorageKey);
      return [];
    }
  }

  private writeManualReservations(reservations: BusinessReservationListItemResponse[]) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.manualReservationsStorageKey, JSON.stringify(reservations));
    } else {
      this.memoryManualReservations = reservations;
    }
  }

  private readReservationOverrides() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryReservationOverrides ?? [];
    }

    const raw = storage.getItem(this.reservationOverridesStorageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as BusinessReservationListItemResponse[];
    } catch {
      storage.removeItem(this.reservationOverridesStorageKey);
      return [];
    }
  }

  private writeReservationOverrides(reservations: BusinessReservationListItemResponse[]) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.reservationOverridesStorageKey, JSON.stringify(reservations));
    } else {
      this.memoryReservationOverrides = reservations;
    }
  }

  private writeBusinessReservation(reservation: BusinessReservationListItemResponse) {
    const manualReservations = this.readManualReservations();
    const manualIndex = manualReservations.findIndex((item) => item.id === reservation.id);

    if (manualIndex >= 0) {
      const nextManualReservations = [...manualReservations];
      nextManualReservations[manualIndex] = reservation;
      this.writeManualReservations(sortMockBusinessReservations(nextManualReservations));
      return;
    }

    this.writeReservationOverrides([
      ...this.readReservationOverrides().filter((item) => item.id !== reservation.id),
      reservation,
    ]);
  }

  private readUser() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryUser;
    }

    const raw = storage.getItem(this.storageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as BusinessUser;
    } catch {
      storage.removeItem(this.storageKey);
      return null;
    }
  }

  private readApplication() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryApplication;
    }

    const raw = storage.getItem(this.applicationStorageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as RestaurantApplicationResponse;
    } catch {
      storage.removeItem(this.applicationStorageKey);
      return null;
    }
  }

  private writeApplication(application: RestaurantApplicationResponse) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.applicationStorageKey, JSON.stringify(application));
    } else {
      this.memoryApplication = application;
    }
  }

  private readRestaurant() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryRestaurant;
    }

    const raw = storage.getItem(this.restaurantStorageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as RestaurantSettingsResponse;
    } catch {
      storage.removeItem(this.restaurantStorageKey);
      return null;
    }
  }

  private writeRestaurant(restaurant: RestaurantSettingsResponse) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.restaurantStorageKey, JSON.stringify(restaurant));
    } else {
      this.memoryRestaurant = restaurant;
    }
  }

  private readReservationProducts() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryReservationProducts ?? [];
    }

    const raw = storage.getItem(this.reservationProductsStorageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ReservationProductResponse[];
    } catch {
      storage.removeItem(this.reservationProductsStorageKey);
      return [];
    }
  }

  private writeReservationProducts(products: ReservationProductResponse[]) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.reservationProductsStorageKey, JSON.stringify(products));
    } else {
      this.memoryReservationProducts = products;
    }
  }
}

function queryString(query: object) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const serialized = searchParams.toString();

  return serialized ? `?${serialized}` : "";
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return {
      message: response.statusText,
    };
  }
}

export function createBusinessApiClient(): BusinessApiClient {
  const mode = import.meta.env.VITE_BUSINESS_API_MODE ?? "mock";

  if (mode === "http") {
    return new HttpBusinessApiClient(import.meta.env.VITE_BUSINESS_API_BASE_URL);
  }

  return new MockBusinessApiClient();
}

function getBrowserStorage() {
  const storage = typeof window === "undefined" ? null : window.localStorage;

  if (
    storage &&
    typeof storage.getItem === "function" &&
    typeof storage.setItem === "function" &&
    typeof storage.removeItem === "function"
  ) {
    return storage;
  }

  return null;
}

function toMockApplication(
  id: number,
  request: RestaurantApplicationSaveRequest,
): RestaurantApplicationResponse {
  return {
    id,
    status: "DRAFT",
    restaurant: {
      id: 2001,
      status: "DRAFT",
      name: request.restaurantName ?? null,
      slug: null,
      description: request.restaurantDescription ?? null,
      phone: request.restaurantPhone ?? null,
      addressLine1: request.addressLine1 ?? null,
      addressLine2: request.addressLine2 ?? null,
      postalCode: request.postalCode ?? null,
      cuisineTypes: request.cuisineTypes ?? [],
      coverImageFileId: request.coverImageFileId ?? null,
      timezone: "Asia/Seoul",
    },
    businessRegistrationNo: request.businessRegistrationNo ?? null,
    businessName: request.businessName ?? null,
    representativeName: request.representativeName ?? null,
    businessAddress: request.businessAddress ?? null,
    businessLicenseFileId: request.businessLicenseFileId ?? null,
    managerName: request.managerName ?? null,
    managerPhone: request.managerPhone ?? null,
    managerEmail: request.managerEmail ?? null,
    contactVerified: request.contactVerified ?? false,
    submittedAt: null,
    reviewedAt: null,
    reviewNote: null,
    rejectionReason: null,
  };
}

function fromApplication(
  application: RestaurantApplicationResponse | null,
): RestaurantApplicationSaveRequest {
  if (!application) {
    return {};
  }

  return {
    restaurantName: application.restaurant.name,
    restaurantDescription: application.restaurant.description,
    restaurantPhone: application.restaurant.phone,
    addressLine1: application.restaurant.addressLine1,
    addressLine2: application.restaurant.addressLine2,
    postalCode: application.restaurant.postalCode,
    cuisineTypes: application.restaurant.cuisineTypes,
    coverImageFileId: application.restaurant.coverImageFileId,
    businessRegistrationNo: application.businessRegistrationNo,
    businessName: application.businessName,
    representativeName: application.representativeName,
    businessAddress: application.businessAddress,
    businessLicenseFileId: application.businessLicenseFileId,
    managerName: application.managerName,
    managerPhone: application.managerPhone,
    managerEmail: application.managerEmail,
    contactVerified: application.contactVerified,
  };
}

function submissionMissingFields(application: RestaurantApplicationResponse) {
  const missing: string[] = [];

  if (!application.restaurant.name?.trim()) missing.push("restaurantName");
  if (!application.restaurant.phone?.trim()) missing.push("restaurantPhone");
  if (!application.restaurant.addressLine1?.trim()) missing.push("addressLine1");
  if (application.restaurant.cuisineTypes.length === 0) missing.push("cuisineTypes");
  if (!application.businessRegistrationNo?.trim()) missing.push("businessRegistrationNo");
  if (!application.businessName?.trim()) missing.push("businessName");
  if (!application.representativeName?.trim()) missing.push("representativeName");
  if (!application.businessAddress?.trim()) missing.push("businessAddress");
  if (!application.businessLicenseFileId) missing.push("businessLicenseFileId");
  if (!application.managerName?.trim()) missing.push("managerName");
  if (!application.managerPhone?.trim()) missing.push("managerPhone");
  if (!application.contactVerified) missing.push("contactVerified");

  return missing;
}

function defaultMockRestaurant(): RestaurantSettingsResponse {
  return {
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
    approvedAt: new Date().toISOString(),
    reservationPage: {
      id: 1,
      slug: "cheongdam-main",
      status: "PRIVATE",
      publishedAt: null,
      unpublishedAt: null,
      publicUrl: "/r/cheongdam-main",
      publishable: false,
      publishBlockers: ["businessHours"],
    },
    businessHours: [],
    holidayRules: [],
  };
}

function reservationPageBlockers(restaurant: RestaurantSettingsResponse, slug: string) {
  const blockers: string[] = [];

  if (restaurant.status !== "APPROVED") blockers.push("restaurantStatus");
  if (!restaurant.name?.trim()) blockers.push("name");
  if (!restaurant.phone?.trim()) blockers.push("phone");
  if (!restaurant.addressLine1?.trim()) blockers.push("addressLine1");
  if (restaurant.cuisineTypes.length === 0) blockers.push("cuisineTypes");
  if (!slug.trim()) blockers.push("slug");
  if (restaurant.businessHours.length === 0) blockers.push("businessHours");

  return blockers;
}

const defaultReservationProductDays: BusinessDayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function toMockReservationProduct(
  id: number,
  request: ReservationProductSaveRequest,
  current?: ReservationProductResponse,
): ReservationProductResponse {
  const now = new Date().toISOString();
  const name = request.name === undefined ? (current?.name ?? "") : (request.name?.trim() ?? "");
  const description =
    request.description === undefined
      ? (current?.description ?? null)
      : trimToNull(request.description);
  const priceAmount = request.priceAmount ?? current?.priceAmount ?? 0;
  const minPartySize = request.minPartySize ?? current?.minPartySize ?? 1;
  const maxPartySize = request.maxPartySize ?? current?.maxPartySize ?? minPartySize;
  const slotCapacity = request.slotCapacity ?? current?.slotCapacity ?? 1;
  const availableStartTime =
    request.availableStartTime === undefined
      ? (current?.availableStartTime ?? null)
      : trimToNull(request.availableStartTime);
  const availableEndTime =
    request.availableEndTime === undefined
      ? (current?.availableEndTime ?? null)
      : trimToNull(request.availableEndTime);

  if (!name) {
    throw new ApiError("상품명이 필요합니다.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(priceAmount) || priceAmount < 0) {
    throw new ApiError("가격은 0 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (
    !Number.isInteger(minPartySize) ||
    !Number.isInteger(maxPartySize) ||
    minPartySize < 1 ||
    maxPartySize < 1 ||
    minPartySize > maxPartySize
  ) {
    throw new ApiError("예약 인원 범위가 올바르지 않습니다.", 400, "VALIDATION_ERROR");
  }
  if (maxPartySize > 20) {
    throw new ApiError("단체 예약 상품은 MVP 범위에서 제외됩니다.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(slotCapacity) || slotCapacity < 1) {
    throw new ApiError("슬롯 재고는 1 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (Boolean(availableStartTime) !== Boolean(availableEndTime)) {
    throw new ApiError("예약 가능 시작/종료 시간을 함께 입력해야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (availableStartTime && availableEndTime && availableStartTime >= availableEndTime) {
    throw new ApiError(
      "예약 가능 시작 시간은 종료 시간보다 빨라야 합니다.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return {
    id,
    restaurantId: current?.restaurantId ?? 1,
    name,
    description,
    priceAmount,
    visible: request.visible ?? current?.visible ?? true,
    status: current?.status ?? "ACTIVE",
    minPartySize,
    maxPartySize,
    availableDays: normalizeReservationProductDays(request.availableDays, current),
    availableStartTime,
    availableEndTime,
    slotCapacity,
    paymentPolicyType: current?.paymentPolicyType ?? "NONE",
    paymentAmount: current?.paymentAmount ?? null,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

function normalizeReservationProductDays(
  requestedDays: BusinessDayOfWeek[] | null | undefined,
  current?: ReservationProductResponse,
) {
  if (requestedDays === undefined) {
    return current?.availableDays ?? defaultReservationProductDays;
  }

  if (!requestedDays || requestedDays.length === 0) {
    return defaultReservationProductDays;
  }

  return Array.from(new Set(requestedDays));
}

function nextReservationProductId(products: ReservationProductResponse[]) {
  return products.reduce((maxId, product) => Math.max(maxId, product.id), 6000) + 1;
}

function sortMockReservationProducts(products: ReservationProductResponse[]) {
  return [...products].sort((a, b) => {
    const createdAtDiff = timestamp(b.createdAt) - timestamp(a.createdAt);

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return b.id - a.id;
  });
}

function timestamp(value: string | null) {
  return value ? Date.parse(value) || 0 : 0;
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePaymentPolicy(
  productId: number,
  request: ReservationProductPaymentPolicyRequest,
  product: ReservationProductResponse,
): ReservationProductPaymentPolicyResponse {
  const paymentAmount = request.paymentAmount ?? null;
  const noShowFeeAmount = request.noShowFeeAmount ?? null;

  if (paymentAmount !== null && (!Number.isInteger(paymentAmount) || paymentAmount < 0)) {
    throw new ApiError("결제 금액은 0 이상 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (noShowFeeAmount !== null && (!Number.isInteger(noShowFeeAmount) || noShowFeeAmount < 0)) {
    throw new ApiError("노쇼 수수료는 0 이상 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }

  if (request.paymentMode === "DEPOSIT" && (!paymentAmount || paymentAmount < 1)) {
    throw new ApiError("예약금은 1원 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (request.paymentMode === "PREPAY" && product.priceAmount < 1) {
    throw new ApiError("전액 선결제 상품은 가격이 1원 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (request.paymentMode === "CARD_GUARANTEE" && (!noShowFeeAmount || noShowFeeAmount < 1)) {
    throw new ApiError("카드 보증 수수료는 1원 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }

  return {
    productId,
    paymentMode: request.paymentMode,
    depositType:
      request.paymentMode === "DEPOSIT" ? (request.depositType ?? "PER_RESERVATION") : null,
    paymentAmount:
      request.paymentMode === "DEPOSIT"
        ? paymentAmount
        : request.paymentMode === "PREPAY"
          ? product.priceAmount
          : null,
    noShowFeeAmount: request.paymentMode === "CARD_GUARANTEE" ? noShowFeeAmount : null,
    updatedAt: new Date().toISOString(),
  };
}

function validateRefundRate(refundRate: number) {
  if (!Number.isInteger(refundRate) || refundRate < 0 || refundRate > 100) {
    throw new ApiError("환불율은 0부터 100 사이 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
}

function defaultMockBusinessReservations(): BusinessReservationListItemResponse[] {
  const today = todayDateString();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  return [
    toMockBusinessReservation({
      id: 7001,
      reservationNumber: "RSV-7001",
      status: "CONFIRMED",
      source: "ONLINE",
      visitDate: today,
      startTime: "11:30:00",
      endTime: "13:00:00",
      partySize: 2,
      productId: 6001,
      productName: "디너 코스",
      customerId: 8001,
      customerName: "김예약",
      phoneMasked: "010-****-5678",
      hasCustomerRequest: true,
      hasOwnerNote: false,
      paymentStatus: "NOT_REQUIRED",
      paymentActionRequired: false,
    }),
    toMockBusinessReservation({
      id: 7002,
      reservationNumber: "RSV-7002",
      status: "MODIFIED",
      source: "MANUAL_PHONE",
      visitDate: today,
      startTime: "13:00:00",
      endTime: "14:30:00",
      partySize: 4,
      productId: 6002,
      productName: "런치 코스",
      customerId: 8002,
      customerName: "이수정",
      phoneMasked: "010-****-9988",
      hasCustomerRequest: false,
      hasOwnerNote: true,
      paymentStatus: "OFFLINE",
      paymentActionRequired: false,
    }),
    toMockBusinessReservation({
      id: 7003,
      reservationNumber: "RSV-7003",
      status: "CANCELLED_BY_CUSTOMER",
      source: "ONLINE",
      visitDate: today,
      startTime: "18:30:00",
      endTime: "20:00:00",
      partySize: 3,
      productId: 6001,
      productName: "디너 코스",
      customerId: 8003,
      customerName: "박취소",
      phoneMasked: "010-****-0000",
      hasCustomerRequest: false,
      hasOwnerNote: false,
      paymentStatus: "REFUND_PENDING",
      paymentActionRequired: true,
    }),
    toMockBusinessReservation({
      id: 7004,
      reservationNumber: "RSV-7004",
      status: "COMPLETED",
      source: "MANUAL_WALK_IN",
      visitDate: tomorrow,
      startTime: "12:00:00",
      endTime: "13:30:00",
      partySize: 2,
      productId: 6002,
      productName: "런치 코스",
      customerId: 8004,
      customerName: "최방문",
      phoneMasked: "010-****-1122",
      hasCustomerRequest: false,
      hasOwnerNote: true,
      paymentStatus: "PAID",
      paymentActionRequired: false,
    }),
    toMockBusinessReservation({
      id: 7005,
      reservationNumber: "RSV-7005",
      status: "NO_SHOW",
      source: "ONLINE",
      visitDate: nextWeek,
      startTime: "19:00:00",
      endTime: "20:30:00",
      partySize: 2,
      productId: 6001,
      productName: "디너 코스",
      customerId: 8005,
      customerName: "오민준",
      phoneMasked: "010-****-4455",
      hasCustomerRequest: true,
      hasOwnerNote: true,
      paymentStatus: "CARD_GUARANTEE",
      paymentActionRequired: true,
    }),
  ];
}

function defaultMockReservationProducts() {
  return [
    {
      id: 6001,
      name: "디너 코스",
      maxPartySize: 6,
    },
    {
      id: 6002,
      name: "런치 코스",
      maxPartySize: 8,
    },
  ];
}

function toMockBusinessReservation({
  id,
  reservationNumber,
  status,
  source,
  visitDate,
  startTime,
  endTime,
  partySize,
  productId,
  productName,
  customerId,
  customerName,
  phoneMasked,
  hasCustomerRequest,
  hasOwnerNote,
  paymentStatus,
  paymentActionRequired,
}: {
  id: number;
  reservationNumber: string;
  status: BusinessReservationStatus;
  source: BusinessReservationSource;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  productId: number;
  productName: string;
  customerId: number;
  customerName: string;
  phoneMasked: string;
  hasCustomerRequest: boolean;
  hasOwnerNote: boolean;
  paymentStatus: string;
  paymentActionRequired: boolean;
}): BusinessReservationListItemResponse {
  return {
    id,
    reservationNumber,
    status,
    statusLabel: businessReservationStatusLabel(status),
    statusTone: businessReservationStatusTone(status),
    source,
    reservedStartAt: toDateTimeIsoString(visitDate, startTime),
    reservedEndAt: toDateTimeIsoString(visitDate, endTime),
    visitDate,
    startTime,
    endTime,
    partySize,
    productId,
    productName,
    customer: {
      id: customerId,
      name: customerName,
      phoneMasked,
    },
    hasCustomerRequest,
    hasOwnerNote,
    paymentStatus,
    paymentActionRequired,
  };
}

function toMockBusinessReservationDetail(
  reservation: BusinessReservationListItemResponse,
  overrides: {
    customerPhone?: string;
    customerRequest?: string | null;
    cancelReason?: string | null;
  } = {},
): BusinessReservationDetailResponse {
  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    status: reservation.status,
    statusLabel: reservation.statusLabel,
    statusTone: reservation.statusTone,
    source: reservation.source,
    reservedStartAt: reservation.reservedStartAt,
    reservedEndAt: reservation.reservedEndAt,
    visitDate: reservation.visitDate,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    partySize: reservation.partySize,
    product: {
      id: reservation.productId,
      name: reservation.productName,
    },
    customer: {
      id: reservation.customer.id,
      name: reservation.customer.name,
      phoneNumber: overrides.customerPhone ?? mockCustomerPhoneNumber(reservation.id),
      visitCount: reservation.status === "COMPLETED" ? 3 : 1,
      noShowCount: reservation.status === "NO_SHOW" ? 1 : 0,
    },
    customerRequest:
      overrides.customerRequest ??
      (reservation.hasCustomerRequest ? "창가 좌석 요청, 알레르기 확인 필요" : null),
    ownerNote: reservation.hasOwnerNote ? "전화 확인 완료. 방문 전 좌석 배정 확인." : null,
    paymentStatus: reservation.paymentStatus,
    paymentActionRequired: reservation.paymentActionRequired,
    cancelledAt: isCancelledReservation(reservation)
      ? toDateTimeIsoString(reservation.visitDate, reservation.startTime)
      : null,
    cancelReason:
      overrides.cancelReason ??
      (isCancelledReservation(reservation)
        ? reservation.status === "CANCELLED_BY_RESTAURANT"
          ? "매장 사유"
          : "고객 요청"
        : null),
    completedAt:
      reservation.status === "COMPLETED"
        ? toDateTimeIsoString(reservation.visitDate, reservation.endTime)
        : null,
    noShowAt:
      reservation.status === "NO_SHOW"
        ? toDateTimeIsoString(reservation.visitDate, reservation.endTime)
        : null,
    auditLogs: reservation.hasOwnerNote
      ? [
          {
            id: reservation.id + 9000,
            action: "reservation.owner_note_updated",
            createdAt: toDateTimeIsoString(reservation.visitDate, reservation.startTime),
          },
        ]
      : [],
  };
}

function filterMockBusinessReservations(
  reservations: BusinessReservationListItemResponse[],
  query: BusinessReservationListQuery,
) {
  const from = query.date ?? query.from ?? todayDateString();
  const to = query.date ?? query.to ?? from;
  const searchTerm = query.query?.trim().toLowerCase() ?? "";
  const startTime = normalizeTime(query.startTime);
  const endTime = normalizeTime(query.endTime);

  return reservations
    .filter((reservation) => {
      if (reservation.visitDate < from || reservation.visitDate > to) {
        return false;
      }
      if (!query.includeCancelled && !query.status && isCancelledReservation(reservation)) {
        return false;
      }
      if (query.status && reservation.status !== query.status) {
        return false;
      }
      if (query.productId && reservation.productId !== query.productId) {
        return false;
      }
      if (startTime && reservation.startTime < startTime) {
        return false;
      }
      if (endTime && reservation.startTime >= endTime) {
        return false;
      }
      if (searchTerm && !businessReservationSearchText(reservation).includes(searchTerm)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const timeDiff = a.startTime.localeCompare(b.startTime);

      if (timeDiff !== 0) {
        return timeDiff;
      }

      return a.id - b.id;
    });
}

function normalizeManualReservationRequest(request: BusinessManualReservationCreateRequest) {
  const productId = request.productId ?? 0;
  const visitDate = request.visitDate?.trim() ?? "";
  const startTime = normalizeTime(request.startTime) ?? "";
  const partySize = request.partySize ?? 0;
  const customerName = request.customerName?.trim() ?? "";
  const customerPhone = request.customerPhone?.replace(/\D/g, "") ?? "";
  const customerRequest = request.customerRequest?.trim() || null;

  if (!Number.isInteger(productId) || productId < 1) {
    throw new ApiError("예약 상품을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    throw new ApiError("방문일을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
    throw new ApiError("방문 시간을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw new ApiError("인원은 1명 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (!customerName) {
    throw new ApiError("고객명을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (customerPhone.length < 8 || customerPhone.length > 20) {
    throw new ApiError("고객 전화번호를 확인해 주세요.", 400, "VALIDATION_ERROR");
  }

  return {
    source: request.source ?? "MANUAL_PHONE",
    productId,
    visitDate,
    startTime,
    partySize,
    customerName,
    customerPhone,
    customerRequest,
  };
}

function normalizeBusinessReservationUpdateRequest(
  request: BusinessReservationUpdateRequest,
  reservation: BusinessReservationListItemResponse,
) {
  const productId = request.productId ?? reservation.productId;
  const visitDate = request.visitDate?.trim() || reservation.visitDate;
  const startTime = normalizeTime(request.startTime) ?? reservation.startTime;
  const partySize = request.partySize ?? reservation.partySize;

  if (!Number.isInteger(productId) || productId < 1) {
    throw new ApiError("예약 상품을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    throw new ApiError("방문일을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
    throw new ApiError("방문 시간을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw new ApiError("인원은 1명 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }

  return {
    productId,
    visitDate,
    startTime,
    partySize,
  };
}

function normalizeBusinessReservationCancelRequest(request: BusinessReservationCancelRequest) {
  const reason = request.reason?.trim() ?? "";

  if (!reason) {
    throw new ApiError("취소 사유를 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (reason.length > 255) {
    throw new ApiError("취소 사유는 255자 이하여야 합니다.", 400, "VALIDATION_ERROR");
  }

  return reason;
}

function normalizeBusinessReservationNoShowRequest(request: BusinessReservationNoShowRequest) {
  const reason = request.reason?.trim() ?? "";

  if (reason.length > 255) {
    throw new ApiError("노쇼 사유는 255자 이하여야 합니다.", 400, "VALIDATION_ERROR");
  }

  return {
    reason: reason || null,
    force: Boolean(request.force),
  };
}

function patchMockBusinessReservation(
  reservation: BusinessReservationListItemResponse,
  patch: Partial<
    Pick<
      BusinessReservationListItemResponse,
      "status" | "visitDate" | "startTime" | "endTime" | "partySize" | "productId" | "productName"
    >
  >,
) {
  const status = patch.status ?? reservation.status;
  const visitDate = patch.visitDate ?? reservation.visitDate;
  const startTime = patch.startTime ?? reservation.startTime;
  const endTime = patch.endTime ?? reservation.endTime;

  return {
    ...reservation,
    ...patch,
    status,
    statusLabel: businessReservationStatusLabel(status),
    statusTone: businessReservationStatusTone(status),
    visitDate,
    startTime,
    endTime,
    reservedStartAt: toDateTimeIsoString(visitDate, startTime),
    reservedEndAt: toDateTimeIsoString(visitDate, endTime),
  } satisfies BusinessReservationListItemResponse;
}

function isActionableBusinessReservation(status: BusinessReservationStatus) {
  return status === "CONFIRMED" || status === "MODIFIED";
}

function nextBusinessReservationId(reservations: BusinessReservationListItemResponse[]) {
  return reservations.reduce((maxId, reservation) => Math.max(maxId, reservation.id), 7000) + 1;
}

function sortMockBusinessReservations(reservations: BusinessReservationListItemResponse[]) {
  return [...reservations].sort((a, b) => {
    const dateDiff = a.visitDate.localeCompare(b.visitDate);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    const timeDiff = a.startTime.localeCompare(b.startTime);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return a.id - b.id;
  });
}

function maskPhoneNumber(phoneNumber: string) {
  const last4 = phoneNumber.slice(-4);

  return last4 ? `010-****-${last4}` : "010-****-0000";
}

function addMinutes(time: string, minutes: number) {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const date = new Date(1970, 0, 1, hour, minute + minutes);
  const nextHour = String(date.getHours()).padStart(2, "0");
  const nextMinute = String(date.getMinutes()).padStart(2, "0");

  return `${nextHour}:${nextMinute}:00`;
}

function mockCustomerPhoneNumber(reservationId: number) {
  const phoneNumbers: Record<number, string> = {
    7001: "010-1234-5678",
    7002: "010-8899-9988",
    7003: "010-9999-0000",
    7004: "010-2211-1122",
    7005: "010-3344-4455",
  };

  return phoneNumbers[reservationId] ?? "010-0000-0000";
}

function toBusinessReservationSummary(items: BusinessReservationListItemResponse[]) {
  return {
    totalReservations: items.length,
    totalPartySize: items.reduce((total, item) => total + item.partySize, 0),
    confirmedCount: items.filter((item) => item.status === "CONFIRMED").length,
    modifiedCount: items.filter((item) => item.status === "MODIFIED").length,
    completedCount: items.filter((item) => item.status === "COMPLETED").length,
    cancelledCount: items.filter(isCancelledReservation).length,
    noShowCount: items.filter((item) => item.status === "NO_SHOW").length,
  } satisfies BusinessReservationSummaryResponse;
}

function businessReservationSearchText(reservation: BusinessReservationListItemResponse) {
  return [
    reservation.reservationNumber,
    reservation.customer.name,
    reservation.customer.phoneMasked,
    reservation.productName,
    reservation.statusLabel,
    reservation.paymentStatus,
  ]
    .join(" ")
    .toLowerCase();
}

function businessReservationStatusLabel(status: BusinessReservationStatus) {
  const labels: Record<BusinessReservationStatus, string> = {
    PENDING: "확인 대기",
    CONFIRMED: "확정",
    MODIFIED: "변경",
    CANCELLED_BY_CUSTOMER: "고객 취소",
    CANCELLED_BY_RESTAURANT: "매장 취소",
    COMPLETED: "방문 완료",
    NO_SHOW: "노쇼",
  };

  return labels[status];
}

function businessReservationStatusTone(status: BusinessReservationStatus) {
  const tones: Record<BusinessReservationStatus, string> = {
    PENDING: "warning",
    CONFIRMED: "success",
    MODIFIED: "info",
    CANCELLED_BY_CUSTOMER: "muted",
    CANCELLED_BY_RESTAURANT: "danger",
    COMPLETED: "success",
    NO_SHOW: "danger",
  };

  return tones[status];
}

function isCancelledReservation(reservation: BusinessReservationListItemResponse) {
  return (
    reservation.status === "CANCELLED_BY_CUSTOMER" ||
    reservation.status === "CANCELLED_BY_RESTAURANT"
  );
}

function normalizeTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.length === 5 ? `${value}:00` : value;
}

function todayDateString() {
  return formatDateString(new Date());
}

function firstDayOfMonth(value: string) {
  const date = parseDateString(value);

  return formatDateString(new Date(date.getFullYear(), date.getMonth(), 1));
}

function lastDayOfMonth(value: string) {
  const date = parseDateString(value);

  return formatDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function addDays(value: string, days: number) {
  const date = parseDateString(value);
  date.setDate(date.getDate() + days);

  return formatDateString(date);
}

function eachDate(from: string, to: string) {
  const dates: string[] = [];
  const current = parseDateString(from);
  const end = parseDateString(to);

  while (current <= end) {
    dates.push(formatDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function parseDateString(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateTimeIsoString(date: string, time: string) {
  return new Date(`${date}T${time}+09:00`).toISOString();
}
