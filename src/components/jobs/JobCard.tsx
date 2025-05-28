"use client";

import type { Job } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Briefcase, Clock, DollarSign, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth"; // To check if user is labour and subscribed

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const { userData } = useAuth();
  const isLabourSubscribed = userData?.role === 'labour' && userData.subscription?.status === 'active';

  const handleApply = () => {
    // Placeholder for apply logic
    // This would typically open a modal or redirect to an application page
    // e.g. router.push(`/jobs/${job.id}/apply`);
    if (!isLabourSubscribed && userData?.role === 'labour') {
       alert("Please subscribe to apply for jobs."); // Replace with toast
       // router.push('/labour/subscription');
       return;
    }
    alert(`Applying for job: ${job.title}`); // Replace with toast
  };

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-primary group-hover:text-primary-dark transition-colors">
            <Link href={`/jobs/${job.id}`} className="hover:underline">{job.title}</Link>
          </CardTitle>
          {job.status === 'open' && <Badge className="bg-green-500 text-white">Open</Badge>}
          {job.status === 'assigned' && <Badge variant="outline">Assigned</Badge>}
          {/* Add other statuses as needed */}
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          Posted by: {job.customerName || "A Customer"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <p className="line-clamp-3 text-muted-foreground">{job.description}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            <span>Skill: {job.requiredSkill}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span>Location: {job.location}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            <span>Duration: {job.duration}</span>
          </div>
          {job.budget && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              <span>Budget: {job.budget}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/jobs/${job.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </Button>
        {userData?.role === 'labour' && job.status === 'open' && (
          <Button 
            size="sm" 
            onClick={handleApply} 
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={!isLabourSubscribed && userData?.role === 'labour'}
            title={!isLabourSubscribed && userData?.role === 'labour' ? "Subscription required to apply" : "Apply for this job"}
          >
            Apply Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
