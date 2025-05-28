
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardFooter
import { useAuth } from "@/hooks/use-auth";
import type { Application, Job } from "@/types"; // Assuming Application type exists
import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Eye, FileText, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data for applied jobs - in a real app, this would be fetched
const mockFetchedApplications: (Application & { jobDetails?: Partial<Job> })[] = [
  { 
    id: 'app1', 
    labourId: 'labourUID', 
    jobId: 'job1', 
    jobTitle: 'Urgent Plumbing for New Condo', 
    dateApplied: new Date(Date.now() - 86400000 * 2).toISOString(), 
    status: 'Pending',
    jobDetails: { requiredSkill: 'Plumbing', location: 'MockCity', customerName: 'ABC Builders' }
  },
  { 
    id: 'app2', 
    labourId: 'labourUID', 
    jobId: 'job3', 
    jobTitle: 'Electrical Rewiring Project', 
    dateApplied: new Date(Date.now() - 86400000 * 5).toISOString(), 
    status: 'Shortlisted',
    jobDetails: { requiredSkill: 'Electrical', location: 'MockCity', customerName: 'Home Renovations Ltd.' }
  },
  {
    id: 'app3',
    labourId: 'labourUID',
    jobId: 'jobNonExistent',
    jobTitle: 'Advanced Carpentry Task',
    dateApplied: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'Accepted',
    jobDetails: { requiredSkill: 'Carpenter', location: 'AnotherCity', customerName: 'BuildIt Wright' }
  }
];


export default function LabourApplicationsPage() {
  const { userData } = useAuth();
  const [applications, setApplications] = useState<(Application & { jobDetails?: Partial<Job> })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching applications for the current labour user
    if (userData?.uid) {
      setLoading(true);
      // In a real app, fetch applications from your backend where labourId === userData.uid
      // And potentially join with job details.
      setTimeout(() => {
        // Filter mock applications by labourUID for this example
        const userApplications = mockFetchedApplications.filter(app => app.labourId === userData.uid);
        setApplications(userApplications);
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
    }
  }, [userData?.uid]);

  const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Shortlisted': return 'default'; // Or a specific color for shortlisted
      case 'Accepted': return 'default'; // Green for accepted
      case 'Rejected_by_customer': return 'destructive';
      case 'Withdrawn_by_labour': return 'outline';
      default: return 'outline';
    }
  };
  const getStatusBadgeClass = (status: Application['status']) => {
    switch (status) {
      case 'Shortlisted': return 'bg-blue-500 text-white';
      case 'Accepted': return 'bg-green-500 text-white';
      default: return '';
    }
  };


  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["labour"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Job Applications</h1>
              <p className="text-muted-foreground">Track the status of jobs you&apos;ve applied for.</p>
            </div>
            <Button asChild>
              <Link href="/jobs"><Briefcase className="mr-2 h-4 w-4" /> Browse More Jobs</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3 text-lg">Loading your applications...</p></div>
          ) : applications.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="text-2xl font-semibold text-foreground">No Applications Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mt-2">
                  You haven&apos;t applied to any jobs yet. 
                  <Button variant="link" asChild className="p-1">
                    <Link href="/jobs">Find jobs now!</Link>
                  </Button>
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {applications.map(app => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <CardTitle className="text-lg">{app.jobTitle || "Job Title Missing"}</CardTitle>
                      <Badge 
                        variant={getStatusBadgeVariant(app.status)}
                        className={getStatusBadgeClass(app.status)}
                        >
                        {app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    <CardDescription>
                      Applied on: {new Date(app.dateApplied as string).toLocaleDateString()}
                      {app.jobDetails?.customerName && ` | Employer: ${app.jobDetails.customerName}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Skill: {app.jobDetails?.requiredSkill || "N/A"} | Location: {app.jobDetails?.location || "N/A"}
                    </p>
                    {app.message && (
                        <p className="text-sm mt-2 italic bg-muted/50 p-2 rounded-md">Your message: &quot;{app.message}&quot;</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    {/* In a real app, this link would go to the specific job details page */}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/jobs?title=${encodeURIComponent(app.jobTitle || "")}`}><Eye className="mr-1 h-4 w-4" /> View Job</Link>
                    </Button>
                    {/* Add withdraw application button if status allows */}
                    {(app.status === 'Pending' || app.status === 'Shortlisted') && (
                        <Button variant="destructive" size="sm" onClick={() => alert('Withdraw functionality to be implemented.')} className="bg-destructive/80 hover:bg-destructive">
                            <Info className="mr-1 h-4 w-4" /> Withdraw
                        </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}

