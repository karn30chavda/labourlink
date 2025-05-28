"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/loader";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=" + window.location.pathname);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <PageLoader message="Checking authentication..." />;
  }

  return <>{children}</>;
}
