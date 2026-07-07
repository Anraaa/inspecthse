import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

interface RoleGuardProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuthStore();
  if (user && roles.includes(user.role)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
