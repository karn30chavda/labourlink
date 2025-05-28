"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LabourProfileForm } from "@/components/forms/LabourProfileForm";

export default function LabourProfilePage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["labour"]}>
        <div className="container mx-auto px-4 py-8">
          <LabourProfileForm />
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
