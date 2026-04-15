"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { getQueryClient } from "@/lib/get-query-client";

// Wraps the React tree with the singleton browser QueryClient so client
// components can use useQuery / useMutation. Devtools only render in dev.

export function QueryProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const client = getQueryClient();
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
