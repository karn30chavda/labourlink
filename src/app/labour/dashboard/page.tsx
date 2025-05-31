
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { getRelevantJobNotifications } from "@/ai/flows/relevant-job-notifications";
import type { Job, JobPosting, Application, DirectJobOffer } from "@/types"; 
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; 
import Link from "next/link";
import { AlertCircle, Briefcase, CheckCircle, Eye, FileText, Loader2, ShieldCheck, CreditCard, Gift, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; 
import { formatRelativeDate, formatFullDate } from '@/lib/utils';


export default function LabourDashboardPage() {
  const { userData } = useAuth();
  const { toast } = useToast(); 
  const [relevantJobs, setRelevantJobs] = useState<JobPosting[]>([]);
  const [loadingAiJobs, setLoadingAiJobs] = useState(true);
  const [errorAiJobs, setErrorAiJobs] = useState<string | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [pendingJobOffersCount, setPendingJobOffersCount] = useState(0);
  const [loadingOffersCount, setLoadingOffersCount] = useState(true);


  const isSubscribed = userData?.subscription?.status === 'active';

  useEffect(() => {
    if (userData && userData.role === 'labour' && userData.uid) { 
      // Fetch AI Suggested Jobs (if subscribed and profile complete)
      const fetchAiJobs = async () => {
        if (!userData.skills || userData.skills.length === 0 || !userData.city) {
            setErrorAiJobs("Please complete your profile (skills and city) to see job suggestions.");
            setLoadingAiJobs(false);
            setRelevantJobs([]);
            return;
        }
        if (!isSubscribed) {
            setErrorAiJobs("Activate your subscription to see AI job suggestions and apply for jobs.");
            setLoadingAiJobs(false);
            setRelevantJobs([]);
            return;
        }

        setLoadingAiJobs(true);
        try {
          const jobsSnapshot = await db.collection("jobs")
            .where("status", "==", "open")
            .where("location", "==", userData.city) 
            .get();
          
          const allOpenJobsInCity: JobPosting[] = jobsSnapshot.docs.map((doc:any) => {
            const jobData = doc.data() as Job; 
            return {
              title: jobData.title,
              description: jobData.description,
              requiredSkill: jobData.requiredSkill,
              location: jobData.location,
            };
          });

          if (allOpenJobsInCity.length > 0 && userData.skills) { 
            const aiInput = {
              laborSkills: userData.skills || [], 
              laborCity: userData.city || '', 
              jobPostings: allOpenJobsInCity,
            };
            const result = await getRelevantJobNotifications(aiInput);
            setRelevantJobs(result.relevantJobs.slice(0, 5)); 
          } else {
            setRelevantJobs([]);
          }
          setErrorAiJobs(null);
        } catch (err) {
          console.error("Error fetching relevant jobs:", err);
          setErrorAiJobs("Failed to load relevant job suggestions.");
          setRelevantJobs([]);
        } finally {
          setLoadingAiJobs(false);
        }
      };
      fetchAiJobs();

      // Fetch Recent Applications
      const fetchRecentApplications = async () => {
        setLoadingApplications(true);
        try {
          const appsSnapshot = await db.collection("applications")
            .where("labourId", "==", userData.uid!)
            .get();
          const appsData = appsSnapshot.docs.map((doc:any) => ({ id: doc.id, ...doc.data()} as Application))
            .sort((a:Application,b:Application) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
            .slice(0,3);
          setRecentApplications(appsData); 
        } catch (error) {
          console.error("Error fetching recent applications:", error);
          toast({ title: "Error", description: "Could not fetch recent applications.", variant: "destructive" });
        } finally {
          setLoadingApplications(false);
        }
      };
      fetchRecentApplications();
      
      // Fetch Pending Direct Job Offers Count
      const fetchPendingOffersCount = async () => {
        setLoadingOffersCount(true);
        try {
            const offersSnapshot = await db.collection("directJobOffers")
                .where("labourId", "==", userData.uid!)
                .where("offerStatus", "==", "pending_labour_response")
                .get();
            setPendingJobOffersCount(offersSnapshot.docs.length);
        } catch (error) {
            console.error("Error fetching pending job offers count:", error);
            // Don't toast for this, it's just a count for the dashboard
        } finally {
            setLoadingOffersCount(false);
        }
      };
      fetchPendingOffersCount();


    } else if (userData && (userData.role !== 'labour')) {
        setLoadingAiJobs(false);
        setLoadingApplications(false);
        setLoadingOffersCount(false);
    } else if (userData && userData.role === 'labour' && (!userData.skills || userData.skills.length === 0 || !userData.city)) {
        setErrorAiJobs("Please complete your profile (skills and city) to see job suggestions.");
        setLoadingAiJobs(false);
        setRelevantJobs([]);
    } else if (userData && userData.role === 'labour' && !isSubscribed) {
        setErrorAiJobs("Activate your subscription to see AI job suggestions and apply for jobs.");
        setLoadingAiJobs(false);
        setRelevantJobs([]);
    }
  }, [userData, isSubscribed, toast]); 
  

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["labour"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome, {userData?.name}!</h1>
              <p className="text-muted-foreground">Here&apos;s your labour dashboard.</p>
            </div>
            <Button asChild>
              <Link href="/jobs"><Search className="mr-2 h-4 w-4" /> Browse All Jobs</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Job Offers</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingOffersCount ? <Loader2 className="h-6 w-6 animate-spin" /> : pendingJobOffersCount}</div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/labour/job-offers" className="text-primary hover:underline">View offers</Link>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingApplications ? <Loader2 className="h-6 w-6 animate-spin" /> : recentApplications.filter(app => app.status === 'Pending' || app.status === 'Shortlisted').length}</div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/labour/applications" className="text-primary hover:underline">Manage applications</Link>
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Availability Status</CardTitle>
                {userData?.availability ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${userData?.availability ? 'text-green-600' : 'text-red-600'}`}>
                  {userData?.availability ? 'Available' : 'Busy'}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/labour/profile" className="text-primary hover:underline">Update your status</Link>
                </p>
              </CardContent>
            </Card>
             <Card className={isSubscribed ? "bg-green-50 dark:bg-green-900/30 border-green-500" : "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                {isSubscribed ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <CreditCard className="h-4 w-4 text-yellow-500" />}
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${isSubscribed ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isSubscribed ? `Active (until ${formatRelativeDate(userData?.subscription?.validUntil)})` : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/labour/subscription" className="text-primary hover:underline">
                    {isSubscribed ? 'Manage Subscription' : 'View Plans'}
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Suggested Jobs For You</CardTitle>
              <CardDescription>
                {isSubscribed ? "Top job matches based on your skills and location. Update your profile for better suggestions." : "Subscribe to view AI job suggestions and apply for jobs."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAiJobs && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Finding relevant jobs...</p>
                </div>
              )}
              {errorAiJobs && !loadingAiJobs && (
                <div className="text-red-500 flex items-center p-4 bg-red-50 dark:bg-red-900/30 rounded-md">
                  <AlertCircle className="mr-2 h-5 w-5"/> {errorAiJobs}
                  {errorAiJobs.includes("profile") && <Button variant="link" asChild><Link href="/labour/profile">Update Profile</Link></Button>}
                  {errorAiJobs.includes("subscription") && <Button variant="link" asChild><Link href="/labour/subscription">View Plans</Link></Button>}
                </div>
              )}
              {!loadingAiJobs && !errorAiJobs && relevantJobs.length === 0 && isSubscribed && (
                 <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
                    <h3 className="text-xl font-semibold text-foreground">No AI Suggestions Right Now</h3>
                    <p className="text-muted-foreground mt-1">
                      We couldn&apos;t find specific AI-powered job matches for you at this moment.
                      Ensure your <Link href="/labour/profile" className="text-primary hover:underline">profile</Link> is complete and up-to-date.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/jobs">Browse All Jobs</Link>
                    </Button>
                 </div>
              )}
              {!loadingAiJobs && !errorAiJobs && relevantJobs.length > 0 && isSubscribed && (
                <ul className="space-y-4">
                  {relevantJobs.map((job, index) => (
                    <li key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-primary">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">Skill: {job.requiredSkill} | Location: {job.location}</p>
                          <p className="text-sm mt-1 line-clamp-2">{job.description}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/jobs?title=${encodeURIComponent(job.title)}`}>View Job</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
               {!isSubscribed && !loadingAiJobs && (
                 <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
                    <h3 className="text-xl font-semibold text-foreground">Unlock AI Job Matches</h3>
                    <p className="text-muted-foreground">Your AI job suggestions are waiting for you!</p>
                    <Button asChild className="mt-3">
                        <Link href="/labour/subscription">Activate Subscription</Link>
                    </Button>
                 </div>
               )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Your Recent Applications</CardTitle>
              <CardDescription>Track the status of jobs you&apos;ve applied for.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApplications ? (
                 <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading recent applications...</p></div>
              ) : recentApplications.length === 0 ? (
                 <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
                    <h3 className="text-xl font-semibold text-foreground">No Recent Applications</h3>
                    <p className="text-muted-foreground mt-1">You haven&apos;t applied to any jobs recently. Let&apos;s find your next opportunity!</p>
                    <Button asChild className="mt-4">
                        <Link href="/jobs"><Search className="mr-2 h-4 w-4"/>Find Jobs Now</Link>
                    </Button>
                 </div>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map(app => (
                    <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div>
                        <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
                        <p className="text-sm text-muted-foreground">Applied {formatRelativeDate(app.dateApplied)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <Badge variant={app.status === 'Shortlisted' ? 'default' : app.status === 'Pending' ? 'secondary' : app.status === 'Accepted' ? 'default' : 'outline'}
                               className={app.status === 'Shortlisted' ? 'bg-blue-500 text-white' : app.status === 'Accepted' ? 'bg-green-500 text-white' : ''}>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                         <Button variant="ghost" size="sm" asChild>
                          <Link href={`/jobs?title=${encodeURIComponent(app.jobTitle || "")}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                   {recentApplications.length > 0 && ( 
                    <div className="text-center mt-4">
                        <Button variant="link" asChild>
                            <Link href="/labour/applications">View All Applications</Link>
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
