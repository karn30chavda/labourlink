
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { matchLabor } from "@/ai/flows/labor-match";
import type { Job, Labor, Application, UserProfile, DirectJobOffer } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase"; 
import { AlertCircle, Briefcase, CheckCircle, Eye, Loader2, Search, Users, Edit3, Trash2, PlusCircle, FileText, UserCheck, MessageSquare, Send, Sparkles, HardHat } from "lucide-react";
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


export default function CustomerDashboardPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [customerJobs, setCustomerJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobApplications, setJobApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  const [allLabourProfiles, setAllLabourProfiles] = useState<UserProfile[]>([]);


  const [selectedJobForMatch, setSelectedJobForMatch] = useState<Job | null>(null);
  const [bestMatch, setBestMatch] = useState<any | null>(null); // Stores AI match result
  const [bestMatchLabourProfile, setBestMatchLabourProfile] = useState<UserProfile | null>(null); // Stores full profile of matched labour
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [offeringJobLoading, setOfferingJobLoading] = useState<string | null>(null); // Store job ID being offered


  const fetchCustomerData = async () => {
    if (!userData?.uid) {
      setLoadingJobs(false);
      setLoadingApplications(false);
      return;
    }

    setLoadingJobs(true);
    setLoadingApplications(true);

    try {
      // Fetch customer's jobs
      const jobsSnapshot = await db.collection("jobs").where("customerId", "==", userData.uid).get();
      const jobsData = jobsSnapshot.docs
          .map((doc: any) => ({ id: doc.id, ...doc.data() } as Job))
          .filter((job: Job) => job.status !== 'deleted')
          .sort((a: Job, b: Job) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
      setCustomerJobs(jobsData);

      if (jobsData.length > 0) {
        const customerJobIds = jobsData.map(job => job.id);
        const allAppsSnapshot = await db.collection("applications").get(); 
        const allApps = allAppsSnapshot.docs.map((doc: any) => doc.data() as Application);
        
        const relevantApplications = allApps
            .filter((app: Application) => customerJobIds.includes(app.jobId))
            .sort((a: Application, b: Application) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
        
        setJobApplications(relevantApplications);
      } else {
        setJobApplications([]);
      }
      // Fetch all labour profiles once for AI matching and offering jobs
      const laboursSnapshot = await db.collection("users").where("role", "==", "labour").get();
      const fetchedLabourProfiles = laboursSnapshot.docs.map((doc: any) => doc.data() as UserProfile);
      setAllLabourProfiles(fetchedLabourProfiles);


    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast({ title: "Error", description: "Could not fetch your dashboard data.", variant: "destructive" });
    } finally {
      setLoadingJobs(false);
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (userData?.uid) {
        fetchCustomerData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.uid]); // Removed toast from dependencies as it can cause re-fetches


  const openJobsCount = customerJobs.filter(job => job.status === 'open').length;
  const pendingApprovalCount = customerJobs.filter(job => job.status === 'pending_approval').length;
  const newApplicationsCount = jobApplications.filter(app => app.status === 'Pending').length;

  const handleFindMatch = async (job: Job) => {
    setSelectedJobForMatch(job);
    setMatchingLoading(true);
    setMatchingError(null);
    setBestMatch(null);
    setBestMatchLabourProfile(null);

    try {
      const availableLaborsForAI: Labor[] = allLabourProfiles
        .filter(profile => profile.availability && profile.city && profile.skills && profile.uid) 
        .map(profile => ({
          uid: profile.uid!, // Include uid
          name: profile.name,
          role: profile.roleType || "Skilled Labour", 
          skills: profile.skills || [],
          availability: profile.availability || false,
          city: profile.city || "",
          pastWorkingSites: profile.pastWorkSites || [],
        }));

      const jobPostDescription = `Title: ${job.title}\nDescription: ${job.description || 'N/A'}\nRequired Skill: ${job.requiredSkill}\nLocation: ${job.location}\nDuration: ${job.duration}`;

      const relevantLabors = availableLaborsForAI.filter(
        l => l.city === job.location && l.skills.includes(job.requiredSkill) && l.availability
      );

      if (relevantLabors.length === 0) {
        setMatchingError("No available labours found matching the job's city and skill requirements in the current database for AI matching.");
        setMatchingLoading(false);
        return;
      }

      const result = await matchLabor({
        jobPost: jobPostDescription,
        availableLabors: relevantLabors,
      });
      
      setBestMatch(result.bestMatch);
      // Find the full profile of the matched labour to get their UID for offering job
      const matchedProfile = allLabourProfiles.find(p => p.name === result.bestMatch.name);
      if(matchedProfile){
        setBestMatchLabourProfile(matchedProfile);
      } else {
        console.warn("Could not find full profile for AI matched labour:", result.bestMatch.name);
        setMatchingError("AI matched a labour, but their full profile couldn't be retrieved for an offer.");
      }

    } catch (error) {
      console.error("Error matching labor:", error);
      setMatchingError("Failed to find a match. Please try again.");
    } finally {
      setMatchingLoading(false);
    }
  };
  
  const handleOfferJob = async (job: Job, labourProfile: UserProfile) => {
    if(!userData || !userData.uid || !labourProfile.uid) {
        toast({ title: "Error", description: "Cannot send offer. User or labour details missing.", variant: "destructive"});
        return;
    }
    setOfferingJobLoading(job.id);
    try {
        const offerData: Omit<DirectJobOffer, 'id' | 'updatedAt'> = {
            jobId: job.id,
            jobTitle: job.title,
            jobDescription: job.description,
            jobRequiredSkill: job.requiredSkill,
            jobLocation: job.location,
            customerId: userData.uid,
            customerName: userData.name,
            labourId: labourProfile.uid,
            labourName: labourProfile.name,
            labourRoleType: labourProfile.roleType,
            offerStatus: 'pending_labour_response',
            createdAt: new Date().toISOString(),
        };
        await db.collection("directJobOffers").add(offerData);
        // Optionally, update the job status to 'offer_sent'
        await db.collection("jobs").doc(job.id).update({ status: 'offer_sent', updatedAt: new Date().toISOString() });
        setCustomerJobs(prevJobs => prevJobs.map(j => j.id === job.id ? {...j, status: 'offer_sent'} : j));

        toast({title: "Job Offered!", description: `Offer sent to ${labourProfile.name} for "${job.title}".`});
        setBestMatch(null); // Clear match details after offering
        setBestMatchLabourProfile(null);
        setSelectedJobForMatch(null);

    } catch (error) {
        console.error("Error offering job:", error);
        toast({title: "Offer Failed", description: "Could not send job offer. Please try again.", variant: "destructive"});
    } finally {
        setOfferingJobLoading(null);
    }
  };


  const handleDeleteJob = async (jobId: string) => {
    try {
      await db.collection("jobs").doc(jobId).update({ status: 'deleted', updatedAt: new Date().toISOString() });
      setCustomerJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({ title: "Job Deleted", description: "The job post has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ title: "Error", description: "Failed to delete the job post.", variant: "destructive" });
    }
  };

  const handleApplicationAction = async (appId: string, action: 'Accepted' | 'Rejected_by_customer') => {
    try {
      await db.collection("applications").doc(appId).update({ status: action, updatedAt: new Date().toISOString() });
      setJobApplications(prevApps => prevApps.map(app => app.id === appId ? { ...app, status: action } : app));
      toast({ title: `Application ${action.replace('_by_customer', '')}`, description: `The application has been marked as ${action.toLowerCase().replace('_by_customer', '')}.` });
    } catch (error) {
        console.error("Error updating application status:", error);
        toast({ title: "Error", description: "Could not update application status.", variant: "destructive"});
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <CardTitle className="text-sm font-medium">New Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{newApplicationsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Pending review for your jobs
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
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-xl font-semibold text-foreground">No Jobs Posted Yet</h3>
                  <p className="text-muted-foreground mt-1">Ready to find the perfect skilled labour for your project?</p>
                  <Button asChild className="mt-4">
                    <Link href="/customer/post-job"><PlusCircle className="mr-2 h-4 w-4" /> Post Your First Job</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerJobs.slice(0,3).map(job => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                           <Badge variant={job.status === 'open' ? 'default' : job.status === 'pending_approval' ? 'secondary' : (job.status === 'assigned' || job.status === 'offer_sent') ? 'outline' : 'destructive'}
                                  className={cn(
                                    'whitespace-nowrap',
                                    job.status === 'open' ? 'bg-green-500 text-white' : '',
                                    job.status === 'assigned' ? 'border-blue-500 text-blue-500' : '',
                                    job.status === 'offer_sent' ? 'border-purple-500 text-purple-500' : '',
                                    job.status === 'pending_approval' ? 'bg-yellow-500 text-white text-center' : ''
                                  )}
                                >
                            {job.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                        <CardDescription>Skill: {job.requiredSkill} | Location: {job.location} | Duration: {job.duration} | Posted: {formatRelativeDate(job.createdAt)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedJobForMatch?.id === job.id && (
                          <div className="mt-4 p-4 border-t">
                            {matchingLoading && <div className="flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Finding best match...</div>}
                            {matchingError && <p className="text-destructive flex items-center"><AlertCircle className="mr-2 h-5 w-5" /> {matchingError}</p>}
                            {bestMatch && bestMatchLabourProfile && (
                              <div>
                                <h4 className="font-semibold text-md mb-2 flex items-center">
                                  <Badge variant="secondary" className="mr-2 bg-accent/20 text-accent-foreground border-accent/50">
                                    <Sparkles className="h-3.5 w-3.5 mr-1 text-accent" />
                                    AI Suggested
                                  </Badge>
                                  Match:
                                </h4>
                                <p><strong>Name:</strong> {bestMatch.name} ({bestMatch.role})</p>
                                <p><strong>Skills:</strong> {bestMatch.skills.join(", ")}</p>
                                <p><strong>City:</strong> {bestMatch.city}</p>
                                <p><strong>Reason:</strong> {bestMatch.matchReason}</p>
                                <Button 
                                    size="sm" 
                                    variant="default" 
                                    className="mt-2 bg-accent hover:bg-accent/90"
                                    onClick={() => handleOfferJob(job, bestMatchLabourProfile)}
                                    disabled={offeringJobLoading === job.id}
                                >
                                  {offeringJobLoading === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                                  Offer Job to {bestMatch.name}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        {(job.status === 'open' || job.status === 'offer_sent') && (
                          <Button variant="outline" size="sm" onClick={() => handleFindMatch(job)} disabled={matchingLoading && selectedJobForMatch?.id === job.id}>
                            {(matchingLoading && selectedJobForMatch?.id === job.id) || offeringJobLoading === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Applications for Your Jobs</CardTitle>
              <CardDescription>Labours who have applied to your job postings.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApplications ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading applications...</p></div>
              ) : jobApplications.length === 0 ? (
                 <div className="text-center py-8">
                    <HardHat className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-xl font-semibold text-foreground">No Applications Received Yet</h3>
                    <p className="text-muted-foreground mt-1">Once labours apply to your jobs, their applications will appear here.</p>
                    {customerJobs.length === 0 && (
                         <Button asChild variant="link" className="mt-2">
                            <Link href="/customer/post-job">Post a job to get started</Link>
                        </Button>
                    )}
                </div>
              ) : (
                <div className="space-y-4">
                  {jobApplications.slice(0, 5).map(app => (
                    <Card key={app.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                          <Badge
                            variant={app.status === 'Pending' ? 'secondary' : app.status === 'Accepted' ? 'default' : app.status === 'Rejected_by_customer' ? 'destructive' : 'outline'}
                            className={cn(
                              'whitespace-nowrap',
                              app.status === 'Accepted' ? 'bg-green-500 text-white' : '',
                              app.status === 'Rejected_by_customer' ? 'px-3 py-0.5 mt-0.5 text-center' : '',
                              app.status === 'Pending' ? 'text-center whitespace-nowrap' : ''
                            )}
                          >
                            {app.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                         <CardDescription>
                          Applicant: {app.labourName} ({app.labourRoleType || 'N/A'}) applied {formatRelativeDate(app.dateApplied)}
                        </CardDescription>
                      </CardHeader>
                      {app.message && <CardContent><p className="text-sm italic text-muted-foreground p-2 bg-muted/30 rounded-md border">Message: "{app.message}"</p></CardContent>}
                       <CardFooter className="flex flex-col items-end gap-2 border-t pt-4">
                        <div className="flex w-full justify-end gap-2">
                            {app.status === 'Pending' && (
                            <>
                                <Button size="sm" variant="outline" className="mx-1 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleApplicationAction(app.id!, 'Accepted')}>
                                    <UserCheck className="mr-2 h-4 w-4"/> Accept
                                </Button>
                                <Button size="sm" variant="destructive" className="mx-1 bg-destructive/80 hover:bg-destructive" onClick={() => handleApplicationAction(app.id!, 'Rejected_by_customer')}>
                                    <Users className="mr-2 h-4 w-4"/> Reject
                                </Button>
                            </>
                            )}
                        </div>
                        <Button size="sm" variant="ghost" className="w-full justify-end sm:w-auto" onClick={() => toast({title: "Info", description: `Contacting ${app.labourName}`})}>
                            <MessageSquare className="mr-2 h-4 w-4"/> Contact {app.labourName}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  {jobApplications.length > 5 && (
                     <div className="text-center mt-4">
                        <Button variant="link" asChild>
                            <Link href="#">View All Applications</Link>
                        </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
