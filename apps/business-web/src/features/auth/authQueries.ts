import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type BusinessLoginRequest,
  type BusinessUser,
  type PasswordResetRequest,
  UnauthorizedApiError,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const currentUserQueryKey = ["business", "current-user"] as const;

export function useCurrentUserQuery() {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof UnauthorizedApiError) {
        return false;
      }

      return failureCount < 1;
    },
  });
}

export function useLoginMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BusinessLoginRequest) => apiClient.login(request),
    onSuccess: (user: BusinessUser) => {
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
}

export function useLogoutMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
    },
  });
}

export function usePasswordResetRequestMutation() {
  const apiClient = useBusinessApiClient();

  return useMutation({
    mutationFn: (request: PasswordResetRequest) => apiClient.requestPasswordReset(request),
  });
}
