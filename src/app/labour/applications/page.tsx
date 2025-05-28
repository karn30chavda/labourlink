
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { Application, Job } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Eye, FileText, Info, Loader2, Trash2, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { db } from "@/lib/firebase";


export default function LabourApplicationsPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!userData?.uid) return;
      setLoading(true);
      try {
        const appsSnapshot = await db.collection("applications").where("labourId", "==", userData.uid).get();
        const appsData = appsSnapshot.docs.map(doc => doc.data() as Application)
          .sort((a, b) => new Date(b.dateApplied as string).getTime() - new Date(a.dateApplied as string).getTime());
        
        // Enrich with job details - for mock, this might be redundant if Application already stores it
        // In a real app, you might fetch full job details if needed, or store denormalized data
        // For now, we assume Application type has enough details or JobCard handles separate job fetching for "View Job"

        setApplications(appsData);
      } catch (error) {
        console.error("Error fetching applications:", error);
        toast({ title: "Error", description: "Could not fetch your applications.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (userData?.uid) {
      fetchApplications();
    }
  }, [userData?.uid, toast]);

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      // In a real app, you'd update Firestore. For mock, update local state.
      await db.collection("applications").doc(applicationId).update({ status: 'Withdrawn_by_labour', updatedAt: new Date().toISOString() });
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId ? { ...app, status: 'Withdrawn_by_labour' } : app
        )
      );
      toast({
        title: "Application Withdrawn",
        description: "You have successfully withdrawn your application.",
      });
    } catch (error) {
       console.error("Error withdrawing application:", error);
       toast({ title: "Error", description: "Could not withdraw application.", variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Shortlisted': return 'default'; 
      case 'Accepted': return 'default'; 
      case 'Rejected_by_customer': return 'destructive';
      case 'Withdrawn_by_labour': return 'outline';
      default: return 'outline';
    }
  };
  const getStatusBadgeClass = (status: Application['status']) => {
    switch (status) {
      case 'Shortlisted': return 'bg-blue-500 text-white';
      case 'Accepted': return 'bg-green-500 text-white';
      case 'Withdrawn_by_labour': return 'border-destructive text-destructive bg-destructive/10';
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
                      {app.customerName && <span className="flex items-center mt-1"><User className="mr-1.5 h-3.5 w-3.5 text-muted-foreground"/> Employer: {app.customerName}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <p className="text-muted-foreground flex items-center">
                           <Briefcase className="mr-1.5 h-4 w-4 text-primary"/> Skill: {app.jobRequiredSkill || "N/A"}
                        </p>
                        <p className="text-muted-foreground flex items-center">
                           <MapPin className="mr-1.5 h-4 w-4 text-primary"/> Location: {app.jobLocation || "N/A"}
                        </p>
                    </div>

                    {app.message && (
                        <p className="text-sm mt-3 italic bg-muted/50 p-3 rounded-md border">Your message: &quot;{app.message}&quot;</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" asChild>
                      {/* This link might need enhancement if /jobs page doesn't easily filter by ID or exact title */}
                      <Link href={`/jobs?title=${encodeURIComponent(app.jobTitle || "")}`}><Eye className="mr-1 h-4 w-4" /> View Original Job</Link>
                    </Button>
                    {(app.status === 'Pending' || app.status === 'Shortlisted') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="bg-destructive/80 hover:bg-destructive">
                            <Trash2 className="mr-1 h-4 w-4" /> Withdraw
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to withdraw?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will withdraw your application for &quot;{app.jobTitle}&quot;. You can re-apply later if the job is still open.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleWithdrawApplication(app.id)} className="bg-destructive hover:bg-destructive/90">
                              Confirm Withdraw
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
