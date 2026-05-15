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
  private memoryUser: BusinessUser | null = null;
  private memoryApplication: RestaurantApplicationResponse | null = null;
  private memoryRestaurant: RestaurantSettingsResponse | null = null;
  private memoryReservationProducts: ReservationProductResponse[] | null = null;
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
