"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "../components/ui";
import { AuthProvider } from "../lib/auth";
import { StoreProvider } from "../lib/store";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <ToastProvider>{children}</ToastProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
