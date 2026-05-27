export const CUSTOMER_MEMBER_ID_STORAGE_KEY = "restaurant.customer.memberId";
export const CUSTOMER_MEMBER_SESSION_CHANGE_EVENT = "restaurant.customer.member-session-change";

interface CustomerMemberStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

const memoryStorage = new Map<string, string>();

export function readStoredCustomerMemberId(
  storage: CustomerMemberStorage | null = browserStorage(),
) {
  const rawValue = storage?.getItem(CUSTOMER_MEMBER_ID_STORAGE_KEY)?.trim();
  const parsed = Number(rawValue);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function storeCustomerMemberId(
  memberId: number,
  storage: CustomerMemberStorage | null = browserStorage(),
) {
  storage?.setItem(CUSTOMER_MEMBER_ID_STORAGE_KEY, String(memberId));
  notifyCustomerMemberSessionChange();
}

export function clearStoredCustomerMemberId(
  storage: CustomerMemberStorage | null = browserStorage(),
) {
  storage?.removeItem(CUSTOMER_MEMBER_ID_STORAGE_KEY);
  notifyCustomerMemberSessionChange();
}

function notifyCustomerMemberSessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CUSTOMER_MEMBER_SESSION_CHANGE_EVENT));
}

function browserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = window.localStorage;
  if (
    typeof storage?.getItem === "function" &&
    typeof storage.setItem === "function" &&
    typeof storage.removeItem === "function"
  ) {
    return storage;
  }

  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
  };
}
