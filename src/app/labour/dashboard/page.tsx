
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { getRelevantJobNotifications } from "@/ai/flows/relevant-job-notifications";
import type { Job, JobPosting } from "@/types"; 
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; 
import Link from "next/link";
import { AlertCircle, Briefcase, CheckCircle, Eye, FileText, Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockAppliedJobs: (Job & { applicationStatus: string; dateApplied: string })[] = [
  { id: 'job1', title: 'Urgent Plumbing for New Condo', customerId: 'cust1', customerName: 'ABC Builders', requiredSkill: 'Plumbing', location: 'MockCity', duration: '1 week', status: 'open', createdAt: new Date().toISOString(), applicationStatus: 'Pending', dateApplied: '2024-07-20' },
  { id: 'job3', title: 'Electrical Rewiring Project', customerId: 'cust2', customerName: 'Home Renovations Ltd.', requiredSkill: 'Electrical', location: 'MockCity', duration: '2 weeks', status: 'open', createdAt: new Date().toISOString(), applicationStatus: 'Shortlisted', dateApplied: '2024-07-18' },
];


export default function LabourDashboardPage() {
  const { userData } = useAuth();
  const [relevantJobs, setRelevantJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState<string | null>(null);

  const isSubscribed = userData?.subscription?.status === 'active';

  useEffect(() => {
    if (userData && userData.role === 'labour' && userData.skills && userData.city) {
      const fetchJobs = async () => {
        try {
          setLoadingJobs(true);
          // Only fetch jobs if subscribed, or adjust logic as needed
          if (!isSubscribed) {
            setErrorJobs("Please subscribe to view AI job suggestions.");
            setRelevantJobs([]);
            setLoadingJobs(false);
            return;
          }

          const jobsSnapshot = await db.collection("jobs").where("status", "==", "open").get();
          
          const allOpenJobs: JobPosting[] = jobsSnapshot.docs.map(doc => {
            const jobData = doc.data() as Job; 
            return {
              title: jobData.title,
              description: jobData.description,
              requiredSkill: jobData.requiredSkill,
              location: jobData.location,
            };
          }).filter(job => job.location === userData.city); 

          if (allOpenJobs.length > 0 && userData.skills) { 
            const aiInput = {
              laborSkills: userData.skills || [], 
              laborCity: userData.city || '', 
              jobPostings: allOpenJobs,
            };
            const result = await getRelevantJobNotifications(aiInput);
            setRelevantJobs(result.relevantJobs.slice(0, 5)); 
          } else {
            setRelevantJobs([]);
          }
          setErrorJobs(null);
        } catch (err) {
          console.error("Error fetching relevant jobs:", err);
          setErrorJobs("Failed to load relevant job suggestions.");
          setRelevantJobs([]);
        } finally {
          setLoadingJobs(false);
        }
      };
      fetchJobs();
    } else if (userData && (userData.role !== 'labour' || !userData.skills || !userData.city)) {
        setLoadingJobs(false);
        setErrorJobs("Please complete your profile (skills and city) to see job suggestions.");
    } else if (userData && userData.role === 'labour' && !isSubscribed) {
        setLoadingJobs(false);
        setErrorJobs("Activate your subscription to see AI job suggestions and apply for jobs.");
        setRelevantJobs([]);
    }
  }, [userData, isSubscribed]);

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
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAppliedJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Jobs you&apos;ve applied to
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
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(userData?.skills && userData.skills.length > 0 && userData.city) ? '100%' : '70%'}</div>
                 <p className="text-xs text-muted-foreground">
                  <Link href="/labour/profile" className="text-primary hover:underline">Complete your profile</Link> for better matches.
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
                  {isSubscribed ? 'Active' : 'Inactive'}
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
              {loadingJobs && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Finding relevant jobs...</p>
                </div>
              )}
              {errorJobs && !loadingJobs && (
                <div className="text-red-500 flex items-center p-4 bg-red-50 dark:bg-red-900/30 rounded-md">
                  <AlertCircle className="mr-2 h-5 w-5"/> {errorJobs}
                  {errorJobs.includes("profile") && <Button variant="link" asChild><Link href="/labour/profile">Update Profile</Link></Button>}
                  {errorJobs.includes("subscription") && <Button variant="link" asChild><Link href="/labour/subscription">View Plans</Link></Button>}
                </div>
              )}
              {!loadingJobs && !errorJobs && relevantJobs.length === 0 && isSubscribed && (
                <p className="text-muted-foreground">No specific job suggestions for you right now. Try browsing all jobs or update your profile.</p>
              )}
              {!loadingJobs && !errorJobs && relevantJobs.length > 0 && isSubscribed && (
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
               {!isSubscribed && !loadingJobs && (
                 <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
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
              {mockAppliedJobs.length === 0 ? (
                <p className="text-muted-foreground">You haven&apos;t applied to any jobs yet. <Link href="/jobs" className="text-primary hover:underline">Find jobs now!</Link></p>
              ) : (
                <div className="space-y-4">
                  {mockAppliedJobs.slice(0,3).map(job => (
                    <div key={job.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">Applied on: {job.dateApplied}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <Badge variant={job.applicationStatus === 'Shortlisted' ? 'default' : job.applicationStatus === 'Pending' ? 'secondary' : 'outline'}
                               className={job.applicationStatus === 'Shortlisted' ? 'bg-green-500 text-white' : ''}>
                          {job.applicationStatus}
                        </Badge>
                         <Button variant="ghost" size="sm" asChild>
                          <Link href={`/jobs?title=${encodeURIComponent(job.title)}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                   {mockAppliedJobs.length > 3 && (
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
