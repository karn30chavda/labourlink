"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { matchLabor } from "@/ai/flows/labor-match";
import type { Job, Labor, UserProfile } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { mockFirestore } from "@/lib/firebase"; // For fetching all jobs
import { AlertCircle, Briefcase, CheckCircle, Eye, Loader2, Search, Users, Edit3, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";


// Mock data for customer's job posts
const mockCustomerJobs: Job[] = [
  { id: 'jobC1', customerId: 'customerUID', title: 'Kitchen Renovation - Plumbing', requiredSkill: 'Plumbing', location: 'Downtown, MockCity', duration: '3 days', status: 'open', createdAt: '2024-07-21T10:00:00Z', approvedByAdmin: true },
  { id: 'jobC2', customerId: 'customerUID', title: 'Office Electrical Setup', requiredSkill: 'Electrical', location: 'Business Park, MockCity', duration: '1 week', status: 'pending_approval', createdAt: '2024-07-22T14:30:00Z' },
  { id: 'jobC3', customerId: 'customerUID', title: 'Garden Masonry Work', requiredSkill: 'Mason', location: 'Suburb, MockCity', duration: '5 days', status: 'assigned', createdAt: '2024-07-15T09:00:00Z', assignedLabourId: 'labourX', approvedByAdmin: true},
];

// Mock available labors for AI matching
const mockAvailableLabors: Labor[] = [
  { name: "Mike P.", role: "Plumber", skills: ["Pipe Fitting", "Drain Cleaning", "Fixture Installation"], availability: true, city: "MockCity", pastWorkingSites: ["Site A", "Site B"] },
  { name: "Sarah E.", role: "Electrician", skills: ["Wiring", "Panel Upgrades", "Lighting Installation"], availability: true, city: "MockCity", pastWorkingSites: ["Site C"] },
  { name: "David M.", role: "Mason", skills: ["Bricklaying", "Concrete Work"], availability: false, city: "MockCity", pastWorkingSites: ["Site D", "Site E"] },
  { name: "Carlos R.", role: "Plumber", skills: ["Pipe Fitting", "Leak Detection"], availability: true, city: "AnotherCity", pastWorkingSites: ["Site F"] },
];


export default function CustomerDashboardPage() {
  const { userData } = useAuth();
  const [selectedJobForMatch, setSelectedJobForMatch] = useState<Job | null>(null);
  const [bestMatch, setBestMatch] = useState<any | null>(null); // Adjust 'any' to specific AI output type
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  const openJobsCount = mockCustomerJobs.filter(job => job.status === 'open').length;
  const pendingApprovalCount = mockCustomerJobs.filter(job => job.status === 'pending_approval').length;

  const handleFindMatch = async (job: Job) => {
    setSelectedJobForMatch(job);
    setMatchingLoading(true);
    setMatchingError(null);
    setBestMatch(null);
    try {
      const jobPostDescription = `Title: ${job.title}\nDescription: ${job.description}\nRequired Skill: ${job.requiredSkill}\nLocation: ${job.location}\nDuration: ${job.duration}`;
      
      // Filter available labors by city and required skill for better AI input
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
              <Link href="/customer/post-job">Post a New Job</Link>
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
              <CardTitle>Your Job Posts</CardTitle>
              <CardDescription>Overview of your recent job listings. <Link href="/customer/jobs" className="text-primary hover:underline">Manage all jobs.</Link></CardDescription>
            </CardHeader>
            <CardContent>
              {mockCustomerJobs.length === 0 ? (
                <p className="text-muted-foreground">You haven&apos;t posted any jobs yet. <Link href="/customer/post-job" className="text-primary hover:underline">Post your first job!</Link></p>
              ) : (
                <div className="space-y-4">
                  {mockCustomerJobs.slice(0,3).map(job => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                           <Badge variant={job.status === 'open' ? 'default' : job.status === 'pending_approval' ? 'secondary' : job.status === 'assigned' ? 'outline' : 'destructive'}
                                  className={`${job.status === 'open' ? 'bg-green-500 text-white' : job.status === 'assigned' ? 'border-blue-500 text-blue-500' : ''}`}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription>Skill: {job.requiredSkill} | Location: {job.location} | Duration: {job.duration}</CardDescription>
                      </CardHeader>
                      <CardContent>
                         {/* AI Match Section for this job */}
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
                            {matchingLoading && selectedJobForMatch?.id === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Users className="h-4 w-4 mr-1" />}
                            Find Match (AI)
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/customer/jobs/${job.id}/edit`}><Edit3 className="h-4 w-4" /></Link>
                        </Button>
                         <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
