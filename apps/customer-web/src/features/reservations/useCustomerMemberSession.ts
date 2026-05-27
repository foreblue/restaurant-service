"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PublicApiError } from "@/shared/api/apiError";
import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import {
  clearStoredCustomerMemberId,
  CUSTOMER_MEMBER_ID_STORAGE_KEY,
  CUSTOMER_MEMBER_SESSION_CHANGE_EVENT,
  readStoredCustomerMemberId,
} from "./customerMemberSession";
import { getPublicMemberById } from "./publicMemberApi";

export function useCustomerMemberSession() {
  const apiClient = usePublicApiClient();
  const [storedMemberId, setStoredMemberId] = useState<number | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    function refreshSession() {
      setStoredMemberId(readStoredCustomerMemberId());
      setSessionLoaded(true);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === CUSTOMER_MEMBER_ID_STORAGE_KEY) {
        refreshSession();
      }
    }

    refreshSession();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(CUSTOMER_MEMBER_SESSION_CHANGE_EVENT, refreshSession);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CUSTOMER_MEMBER_SESSION_CHANGE_EVENT, refreshSession);
    };
  }, []);

  const memberQuery = useQuery({
    enabled: sessionLoaded && Boolean(storedMemberId),
    queryFn: () => getPublicMemberById(storedMemberId ?? 0, apiClient),
    queryKey: ["public-member-session", storedMemberId],
    retry: false,
  });

  useEffect(() => {
    if (!(memberQuery.error instanceof PublicApiError) || memberQuery.error.status !== 404) {
      return;
    }

    clearStoredCustomerMemberId();
    setStoredMemberId(null);
  }, [memberQuery.error]);

  function clearSession() {
    clearStoredCustomerMemberId();
    setStoredMemberId(null);
  }

  return {
    clearSession,
    loading: !sessionLoaded || memberQuery.isLoading,
    member: memberQuery.data ?? null,
    memberError: memberQuery.error,
    memberId: storedMemberId,
    refetchMember: memberQuery.refetch,
    sessionLoaded,
  };
}
