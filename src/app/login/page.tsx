"use client"; // Make it a client component to use hooks

import { LoginForm } from "@/components/forms/LoginForm";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/loader";

export default function LoginPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // User is logged in, redirect them
      if (userData?.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (userData?.role === "customer") {
        router.replace("/customer/dashboard");
      } else if (userData?.role === "labour") {
        router.replace("/labour/dashboard");
      } else {
        router.replace("/"); // Fallback to homepage
      }
    }
  }, [user, userData, loading, router]);

  if (loading || (!loading && user)) {
    // Show loader while checking auth state or if user is found and redirect is in progress
    return <PageLoader message="Checking your session..." />;
  }

  // If not loading and no user, show the login form
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl w-full">
        <div className="hidden md:flex justify-center">
           <Image
            src="https://placehold.co/400x500.png"
            alt="Login illustration"
            width={400}
            height={500}
            className="rounded-lg shadow-xl object-cover"
            data-ai-hint="construction login handshake"
          />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
