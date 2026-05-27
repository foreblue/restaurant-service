import {
  clearStoredCustomerMemberId,
  CUSTOMER_MEMBER_ID_STORAGE_KEY,
  CUSTOMER_MEMBER_SESSION_CHANGE_EVENT,
  readStoredCustomerMemberId,
  storeCustomerMemberId,
} from "./customerMemberSession";

describe("customerMemberSession", () => {
  beforeEach(() => {
    clearStoredCustomerMemberId();
  });

  it("stores and reads the logged-in member id", () => {
    storeCustomerMemberId(3);

    expect(readStoredCustomerMemberId()).toBe(3);
  });

  it("ignores invalid member ids", () => {
    const storage = {
      getItem: (key: string) => (key === CUSTOMER_MEMBER_ID_STORAGE_KEY ? "abc" : null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };

    expect(readStoredCustomerMemberId(storage)).toBeNull();
  });

  it("clears the logged-in member id", () => {
    storeCustomerMemberId(2);
    clearStoredCustomerMemberId();

    expect(readStoredCustomerMemberId()).toBeNull();
  });

  it("notifies same-tab session changes", () => {
    const listener = vi.fn();
    window.addEventListener(CUSTOMER_MEMBER_SESSION_CHANGE_EVENT, listener);

    storeCustomerMemberId(1);
    clearStoredCustomerMemberId();

    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(CUSTOMER_MEMBER_SESSION_CHANGE_EVENT, listener);
  });
});
