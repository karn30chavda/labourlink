
"use client";

import type { Application, Job, UserProfile } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Briefcase, Clock, DollarSign, Eye, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth"; 
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { db } from "@/lib/firebase";
import { useState } from "react";


interface JobCardProps {
  job: Job;
  hasApplied?: boolean;
  onApplySuccess?: (jobId: string) => void;
}

export function JobCard({ job, hasApplied = false, onApplySuccess }: JobCardProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isApplying, setIsApplying] = useState(false);
  
  const isLabour = userData?.role === 'labour';
  const isSubscribed = isLabour && userData?.subscription?.status === 'active';

  const handleApply = async () => {
    if (!isLabour || !userData || !userData.uid) {
      toast({title: "Login as Labour", description: "Please login as a labour user to apply.", variant: "destructive"});
      router.push('/login');
      return;
    }
    if (!isSubscribed) {
       toast({title: "Subscription Required", description: "Please subscribe to a plan to apply for jobs.", variant: "destructive", action: <Button onClick={() => router.push('/labour/subscription')}>View Plans</Button> });
       return;
    }

    setIsApplying(true);
    try {
      const applicationData: Omit<Application, 'id' | 'dateApplied'> = {
        labourId: userData.uid,
        labourName: userData.name,
        jobId: job.id,
        jobTitle: job.title,
        customerId: job.customerId,
        customerName: job.customerName,
        status: 'Pending',
        jobRequiredSkill: job.requiredSkill,
        jobLocation: job.location,
      };
      await db.collection("applications").add(applicationData);
      
      toast({title: "Applied Successfully!", description: `You have applied for: ${job.title}`});
      if (onApplySuccess) {
        onApplySuccess(job.id);
      }
    } catch (error) {
      console.error("Error applying for job:", error);
      toast({title: "Application Failed", description: "Could not submit your application. Please try again.", variant: "destructive"});
    } finally {
      setIsApplying(false);
    }
  };

  let applyButtonContent;
  if (hasApplied) {
    applyButtonContent = (
      <Button size="sm" className="w-full sm:w-auto" disabled>
        <CheckCircle className="mr-2 h-4 w-4" /> Applied
      </Button>
    );
  } else if (isApplying) {
     applyButtonContent = (
      <Button size="sm" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...
      </Button>
    );
  } else {
     const actualButton = (
        <Button 
            size="sm" 
            onClick={handleApply} 
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isLabour && !isSubscribed}
        >
        {isLabour && !isSubscribed && <ShieldAlert className="mr-2 h-4 w-4" />}
        Apply Now
        </Button>
     );
     if (isLabour && !isSubscribed) {
        applyButtonContent = (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>{actualButton}</span> 
                </TooltipTrigger>
                <TooltipContent>
                  <p>Subscription required to apply for jobs.</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-primary" asChild>
                    <Link href="/labour/subscription">View Plans</Link>
                  </Button>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        );
     } else {
        applyButtonContent = actualButton;
     }
  }


  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-primary group-hover:text-primary-dark transition-colors">
            <span className="hover:underline cursor-pointer" onClick={() => toast({title: "Info", description: `Job: ${job.title}. Full job detail page coming soon!`})}>{job.title}</span>
          </CardTitle>
          {job.status === 'open' && <Badge className="bg-green-500 text-white">Open</Badge>}
          {job.status === 'assigned' && <Badge variant="outline">Assigned</Badge>}
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
        <Button variant="outline" size="sm" onClick={() => toast({title: "Info", description: "Detailed job page coming soon!"})}>
          <Eye className="mr-2 h-4 w-4" /> View Details
        </Button>
        {isLabour && applyButtonContent}
      </CardFooter>
    </Card>
  );
}
