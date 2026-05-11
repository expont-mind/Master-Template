"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getQueryClient } from "@/lib/query-client";

const isDev = process.env.NODE_ENV === "development";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        {isDev ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
