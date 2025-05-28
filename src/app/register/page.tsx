
"use client"; // Make it a client component

import { RegisterForm } from "@/components/forms/RegisterForm";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/loader";

export default function RegisterPage() {
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

  // If not loading and no user, show the register form
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl w-full">
        <div className="hidden md:flex justify-center order-last md:order-first">
           <Image
            src="https://images.unsplash.com/photo-1601074231509-dce351c05199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHx1bmRlciUyMGNvbnN0cnVjdGlvbnxlbnwwfHx8fDE3NDg0MjcyODl8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Registration illustration"
            width={400}
            height={500}
            className="rounded-lg shadow-xl object-cover"
            data-ai-hint="construction team planning"
          />
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}

