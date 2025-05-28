
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { JobPostForm } from "@/components/forms/JobPostForm";
import { mockFirestore } from "@/lib/firebase"; // Using mock for now
import type { Job } from "@/types";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { userData } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const jobId = typeof params.jobId === 'string' ? params.jobId : null;

  useEffect(() => {
    if (!jobId) {
      setError("Job ID not found.");
      setLoading(false);
      toast({ title: "Error", description: "Job ID is missing.", variant: "destructive" });
      router.push("/customer/jobs");
      return;
    }

    const fetchJob = async () => {
      try {
        // Replace with actual Firestore fetch:
        // const jobDocRef = doc(db, "jobs", jobId);
        // const jobDoc = await getDoc(jobDocRef);
        const jobDoc = await mockFirestore.collection("jobs").doc(jobId).get(); // MOCK

        if (jobDoc.exists()) {
          const jobData = jobDoc.data() as Job;
          // Ensure the job belongs to the current customer
          if (jobData.customerId !== userData?.uid) {
            toast({ title: "Unauthorized", description: "You are not authorized to edit this job.", variant: "destructive" });
            router.push("/customer/jobs");
            return;
          }
          setJob({ ...jobData, id: jobId }); // Ensure ID is part of the job object
        } else {
          setError("Job not found.");
          toast({ title: "Error", description: "Job not found.", variant: "destructive" });
          router.push("/customer/jobs");
        }
      } catch (e) {
        console.error("Error fetching job:", e);
        setError("Failed to load job details.");
        toast({ title: "Error", description: "Failed to load job details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (userData?.uid) { // Ensure userData is available before fetching
        fetchJob();
    } else if (!userData && !loading) { // If userData is null and not loading, likely an auth issue
        toast({ title: "Authentication Error", description: "Please log in to edit jobs.", variant: "destructive" });
        router.push("/login");
    }

  }, [jobId, router, toast, userData, loading]); // Added loading to dependency array

  if (loading || !userData) {
    return <PageLoader message="Loading job details..." />;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-destructive">{error}</div>;
  }

  if (!job) {
    return <PageLoader message="Job not found or you are not authorized." />;
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["customer"]}>
        <div className="container mx-auto px-4 py-8">
          <JobPostForm job={job} isEditing={true} />
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}

    