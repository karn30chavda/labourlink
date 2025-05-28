"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/loader";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const userRole = userData?.role;

  useEffect(() => {
    if (!authLoading && userData && userRole && !allowedRoles.includes(userRole)) {
       // Redirect to a generic dashboard or home if role doesn't match
      router.push( userRole === "admin" ? "/admin/dashboard" : userRole === "customer" ? "/customer/dashboard" : userRole === "labour" ? "/labour/dashboard" : "/");
    }
  }, [userData, authLoading, router, allowedRoles, userRole]);

  if (authLoading) {
    return <PageLoader message="Verifying access..." />;
  }
  
  if (!userData || !userRole || !allowedRoles.includes(userRole)) {
     return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You do not have permission to view this page.
        </p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
