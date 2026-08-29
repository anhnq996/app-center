import type { ReactNode } from "react";
import AdminLayout from "../../screens/AdminLayout";

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
