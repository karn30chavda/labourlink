"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { JobPostForm } from "@/components/forms/JobPostForm";

export default function PostJobPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["customer"]}>
        <div className="container mx-auto px-4 py-8">
          <JobPostForm />
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
