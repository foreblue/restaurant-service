import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

interface CustomerQueryClientOptions {
  onError?: (
    error: unknown,
    context: { mutationKey?: unknown; queryKey?: unknown; source: string },
  ) => void;
}

export function createCustomerQueryClient(options: CustomerQueryClientOptions = {}) {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        options.onError?.(error, {
          mutationKey: mutation.options.mutationKey,
          source: "mutation",
        });
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        options.onError?.(error, {
          queryKey: query.queryKey,
          source: "query",
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
