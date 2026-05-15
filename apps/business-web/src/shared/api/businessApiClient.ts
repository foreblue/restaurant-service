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
  businessRegistrationNo?: string | null;
  businessName?: string | null;
  representativeName?: string | null;
  businessAddress?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
  managerEmail?: string | null;
  contactVerified?: boolean | null;
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

  private async request<T>(path: string, init: { method?: string; body?: unknown } = {}) {
    const requestInit: RequestInit = {
      method: init.method ?? "GET",
      credentials: "include",
    };

    if (init.body !== undefined) {
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
  private memoryUser: BusinessUser | null = null;
  private memoryApplication: RestaurantApplicationResponse | null = null;

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
      coverImageFileId: null,
      timezone: "Asia/Seoul",
    },
    businessRegistrationNo: request.businessRegistrationNo ?? null,
    businessName: request.businessName ?? null,
    representativeName: request.representativeName ?? null,
    businessAddress: request.businessAddress ?? null,
    businessLicenseFileId: null,
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
    businessRegistrationNo: application.businessRegistrationNo,
    businessName: application.businessName,
    representativeName: application.representativeName,
    businessAddress: application.businessAddress,
    managerName: application.managerName,
    managerPhone: application.managerPhone,
    managerEmail: application.managerEmail,
    contactVerified: application.contactVerified,
  };
}
