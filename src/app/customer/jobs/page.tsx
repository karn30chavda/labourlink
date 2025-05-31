
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase"; // Using MOCK Firebase
import { AlertCircle, Briefcase, Edit3, Eye, Loader2, PlusCircle, Search, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { formatRelativeDate } from '@/lib/utils';
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";

export default function CustomerJobsPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      if (!userData?.uid ) { 
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const jobsSnapshot = await db.collection("jobs").where("customerId", "==", userData.uid).get();
        
        const jobsData = jobsSnapshot.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() } as Job))
            .filter((job: Job) => job.status !== 'deleted')
            .sort((a: Job, b: Job) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by date
        
        console.log("[CustomerJobsPage] Fetched jobs:", JSON.parse(JSON.stringify(jobsData)));
        setJobs(jobsData);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({ title: "Error", description: "Could not fetch your job posts.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (userData?.uid) {
        fetchJobs();
    }
  }, [userData?.uid, toast]); 

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteJob = async (jobId: string) => {
    try {
      await db.collection("jobs").doc(jobId).update({ status: 'deleted', updatedAt: new Date().toISOString() });
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({ title: "Job Deleted", description: "The job post has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ title: "Error", description: "Failed to delete the job post.", variant: "destructive" });
    }
  };
  

  const getStatusBadgeVariant = (status: Job['status']) => {
    switch (status) {
      case 'open': return 'default';
      case 'pending_approval': return 'secondary';
      case 'assigned': case 'in_progress': case 'offer_sent': return 'outline';
      case 'completed': return 'default'; 
      case 'cancelled_by_customer': case 'expired': return 'destructive';
      default: return 'outline';
    }
  };
   const getStatusBadgeClass = (status: Job['status']) => {
    switch (status) {
      case 'open': return 'bg-green-500 text-white';
      case 'pending_approval': return 'bg-yellow-500 text-white text-center';
      case 'assigned': case 'in_progress': return 'border-blue-500 text-blue-500';
      case 'offer_sent': return 'border-purple-500 text-purple-500';
      case 'completed': return 'bg-primary text-primary-foreground';
      default: return '';
    }
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["customer"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Job Posts</h1>
              <p className="text-muted-foreground">Manage all your job listings.</p>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/customer/post-job"><PlusCircle className="mr-2 h-5 w-5" /> Post a New Job</Link>
            </Button>
          </div>

          <div className="mb-6">
            <Search className="absolute h-5 w-5 text-muted-foreground mt-2.5 ml-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search your jobs by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-2 border rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold text-foreground">
                {searchTerm ? "No Matching Jobs Found" : "No Job Posts Yet"}
              </h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm ? "Try adjusting your search term or clear filters." : "It looks like you haven't posted any jobs. Create one now to find skilled labour!"}
              </p>
               {!searchTerm && (
                <Button asChild className="mt-6">
                  <Link href="/customer/post-job"><PlusCircle className="mr-2 h-4 w-4" /> Post Your First Job</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(job => (
                <Card key={job.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge 
                        variant={getStatusBadgeVariant(job.status)}
                        className={cn('whitespace-nowrap', getStatusBadgeClass(job.status))}
                      >
                        {job.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    <CardDescription>
                      Skill: {job.requiredSkill} | Location: {job.location}
                      <br />
                      Posted: {formatRelativeDate(job.createdAt)}
                      {job.updatedAt && job.updatedAt !== job.createdAt && (
                        <> | Updated: {formatRelativeDate(job.updatedAt)}</>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/customer/jobs/${job.id}/edit`}><Edit3 className="mr-1 h-4 w-4" /> Edit</Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 hover:border-destructive">
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will mark the job post &quot;{job.title}&quot; as deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/90">
                            Confirm Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
