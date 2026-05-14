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
  private memoryUser: BusinessUser | null = null;

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
