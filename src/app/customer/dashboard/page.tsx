
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { matchLabor } from "@/ai/flows/labor-match";
import type { Job, Labor } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { mockFirestore } from "@/lib/firebase"; 
import { AlertCircle, Briefcase, CheckCircle, Eye, Loader2, Search, Users, Edit3, Trash2, PlusCircle } from "lucide-react";
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


// Mock available labors for AI matching - This might come from a global state or be fetched
const mockAvailableLabors: Labor[] = [
  { name: "Mike P.", role: "Plumber", skills: ["Pipe Fitting", "Drain Cleaning", "Fixture Installation"], availability: true, city: "MockCity", pastWorkingSites: ["Site A", "Site B"] },
  { name: "Sarah E.", role: "Electrician", skills: ["Wiring", "Panel Upgrades", "Lighting Installation"], availability: true, city: "MockCity", pastWorkingSites: ["Site C"] },
  { name: "David M.", role: "Mason", skills: ["Bricklaying", "Concrete Work"], availability: false, city: "MockCity", pastWorkingSites: ["Site D", "Site E"] },
  { name: "Carlos R.", role: "Plumber", skills: ["Pipe Fitting", "Leak Detection"], availability: true, city: "AnotherCity", pastWorkingSites: ["Site F"] },
];


export default function CustomerDashboardPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [customerJobs, setCustomerJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [selectedJobForMatch, setSelectedJobForMatch] = useState<Job | null>(null);
  const [bestMatch, setBestMatch] = useState<any | null>(null); 
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerJobs = async () => {
      if (!userData?.uid) return;
      setLoadingJobs(true);
      try {
        // Mock fetching jobs for the current customer
        // In a real app: query(collection(db, "jobs"), where("customerId", "==", userData.uid), orderBy("createdAt", "desc"))
        const allJobsSnapshot = await mockFirestore.collection("jobs").where("status", "!=", "deleted").get(); // Mock fetching all
        const jobsData = allJobsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Job))
            .filter(job => job.customerId === userData.uid) // Filter client-side for mock
            .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()); // Sort client-side
        setCustomerJobs(jobsData);
      } catch (error) {
        console.error("Error fetching customer jobs:", error);
        toast({ title: "Error", description: "Could not fetch your job posts.", variant: "destructive" });
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchCustomerJobs();
  }, [userData?.uid, toast]);


  const openJobsCount = customerJobs.filter(job => job.status === 'open').length;
  const pendingApprovalCount = customerJobs.filter(job => job.status === 'pending_approval').length;

  const handleFindMatch = async (job: Job) => {
    setSelectedJobForMatch(job);
    setMatchingLoading(true);
    setMatchingError(null);
    setBestMatch(null);
    try {
      const jobPostDescription = `Title: ${job.title}\nDescription: ${job.description || 'N/A'}\nRequired Skill: ${job.requiredSkill}\nLocation: ${job.location}\nDuration: ${job.duration}`;
      
      const relevantLabors = mockAvailableLabors.filter(
        l => l.city === job.location && l.skills.includes(job.requiredSkill) && l.availability
      );

      if (relevantLabors.length === 0) {
        setMatchingError("No available labors found matching the job's city and skill requirements for AI matching.");
        setMatchingLoading(false);
        return;
      }

      const result = await matchLabor({
        jobPost: jobPostDescription,
        availableLabors: relevantLabors,
      });
      setBestMatch(result.bestMatch);
    } catch (error) {
      console.error("Error matching labor:", error);
      setMatchingError("Failed to find a match. Please try again.");
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      // Mock delete: In a real app, use Firestore's deleteDoc or update status to 'deleted'
      // await deleteDoc(doc(db, "jobs", jobId));
      await mockFirestore.collection("jobs").doc(jobId).update({ status: 'deleted', updatedAt: new Date() }); // Soft delete for mock
      setCustomerJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({ title: "Job Deleted", description: "The job post has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ title: "Error", description: "Failed to delete the job post.", variant: "destructive" });
    }
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["customer"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome, {userData?.name}!</h1>
              <p className="text-muted-foreground">Manage your job posts and find skilled labour.</p>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/customer/post-job"><PlusCircle className="mr-2 h-5 w-5" /> Post a New Job</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Job Posts</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openJobsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Currently open for applications
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingApprovalCount}</div>
                <p className="text-xs text-muted-foreground">
                  Jobs awaiting admin review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Find Labour</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/search-labour">Search Available Labour</Link>
                </Button>
                 <p className="text-xs text-muted-foreground mt-2">
                  Browse profiles and skills
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Recent Job Posts</CardTitle>
              <CardDescription>Overview of your recent job listings. <Link href="/customer/jobs" className="text-primary hover:underline">Manage all jobs.</Link></CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                 <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading your jobs...</p></div>
              ) : customerJobs.length === 0 ? (
                <p className="text-muted-foreground">You haven&apos;t posted any jobs yet. <Link href="/customer/post-job" className="text-primary hover:underline">Post your first job!</Link></p>
              ) : (
                <div className="space-y-4">
                  {customerJobs.slice(0,3).map(job => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                           <Badge variant={job.status === 'open' ? 'default' : job.status === 'pending_approval' ? 'secondary' : job.status === 'assigned' ? 'outline' : 'destructive'}
                                  className={`${job.status === 'open' ? 'bg-green-500 text-white' : job.status === 'assigned' ? 'border-blue-500 text-blue-500' : job.status === 'pending_approval' ? 'bg-yellow-500 text-white' : ''}`}>
                            {job.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                        <CardDescription>Skill: {job.requiredSkill} | Location: {job.location} | Duration: {job.duration}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedJobForMatch?.id === job.id && (
                          <div className="mt-4 p-4 border-t">
                            {matchingLoading && <div className="flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Finding best match...</div>}
                            {matchingError && <p className="text-red-500 flex items-center"><AlertCircle className="mr-2 h-5 w-5" /> {matchingError}</p>}
                            {bestMatch && (
                              <div>
                                <h4 className="font-semibold text-md mb-1">AI Suggested Match:</h4>
                                <p><strong>Name:</strong> {bestMatch.name} ({bestMatch.role})</p>
                                <p><strong>Skills:</strong> {bestMatch.skills.join(", ")}</p>
                                <p><strong>City:</strong> {bestMatch.city}</p>
                                <p><strong>Reason:</strong> {bestMatch.matchReason}</p>
                                <Button size="sm" variant="outline" className="mt-2">Contact {bestMatch.name}</Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        {job.status === 'open' && (
                          <Button variant="outline" size="sm" onClick={() => handleFindMatch(job)} disabled={matchingLoading && selectedJobForMatch?.id === job.id}>
                            {matchingLoading && selectedJobForMatch?.id === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                            Find Match (AI)
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/customer/jobs/${job.id}/edit`}><Edit3 className="h-4 w-4" /></Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the job post &quot;{job.title}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </RoleGuard>
    </AuthGuard>
  );
}

    