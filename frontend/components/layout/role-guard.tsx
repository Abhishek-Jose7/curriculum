"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import type { AuthUser } from "@/context";
import { Loader2 } from "lucide-react";

type Props = {
  allowed: AuthUser["role"][];
  children: React.ReactNode;
  redirectTo?: string;
};

export function RoleGuard({ allowed, children, redirectTo = "/" }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !allowed.includes(user.role)) {
      router.replace(redirectTo);
    }
  }, [loading, user, allowed, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !allowed.includes(user.role)) return null;

  return <>{children}</>;
}
