
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { Job } from "@/types";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";
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


export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const jobsSnapshot = await db.collection("jobs").get();
      const jobsData = jobsSnapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as Job))
        .filter(job => job.status !== 'deleted') // Exclude already deleted jobs from initial fetch
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({ title: "Error", description: "Could not fetch jobs.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [toast]);

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    try {
      await db.collection("jobs").doc(jobId).update({ status: 'deleted', updatedAt: new Date().toISOString() });
      toast({
        title: "Job Deleted",
        description: `The job "${jobTitle}" has been marked as deleted.`,
      });
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ title: "Error", description: "Could not delete job.", variant: "destructive" });
    }
  };
  
  const getStatusBadgeVariant = (status: Job['status']) => {
    switch (status) {
      case 'open': return 'default';
      case 'pending_approval': return 'secondary';
      case 'assigned': case 'in_progress': case 'offer_sent': return 'outline';
      case 'completed': return 'default'; 
      case 'cancelled_by_customer': case 'expired': return 'destructive';
      case 'deleted': return 'destructive';
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
      case 'deleted': return 'bg-muted text-muted-foreground line-through';
      default: return '';
    }
  };


  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.customerName && job.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    job.requiredSkill.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Jobs</h1>
              <p className="text-muted-foreground">View and manage all job posts on the platform.</p>
            </div>
             <Button variant="outline" asChild>
              <Link href="/admin/dashboard">Back to Dashboard</Link>
            </Button>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>All Job Posts ({filteredJobs.length})</CardTitle>
              <CardDescription>
                 <div className="relative mt-2 mb-4">
                    <Search className="absolute h-5 w-5 text-muted-foreground mt-2.5 left-3 pointer-events-none" />
                    <Input
                    type="text"
                    placeholder="Search by title, customer, skill, location, status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-2/3 lg:w-1/2 pl-10 border rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading jobs...</p></div>
              ) : filteredJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No jobs found{searchTerm ? " matching your search" : ""}.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Skill</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Posted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <TableRow key={job.id} className={job.status === 'deleted' ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{job.customerName || 'N/A'}</TableCell>
                          <TableCell>{job.requiredSkill}</TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>{formatRelativeDate(job.createdAt)}</TableCell>
                          <TableCell>
                             <Badge 
                                variant={getStatusBadgeVariant(job.status)}
                                className={cn('whitespace-nowrap', getStatusBadgeClass(job.status))}
                              >
                                {job.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => toast({title: "Info", description:`Viewing details for ${job.title}`})}>
                                    <Eye className="mr-1 h-3.5 w-3.5"/> View
                                </Button>
                                {job.status !== 'deleted' && (
                                    <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="bg-destructive/80 hover:bg-destructive">
                                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will mark the job &quot;{job.title}&quot; as deleted. It will no longer be visible to users.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteJob(job.id, job.title)} className="bg-destructive hover:bg-destructive/90">
                                            Confirm Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
