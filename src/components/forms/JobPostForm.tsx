
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader } from "@/components/ui/loader";
import type { Job } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { generateJobDescription as genJobDescAiFlow } from '@/ai/flows/job-description-generator';
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const jobPostFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }).max(100),
  descriptionKeywords: z.string().min(10, { message: "Provide at least 10 characters of keywords for description."}).max(200).optional(),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }).max(2000),
  requiredSkill: z.string().min(1, { message: "Please select a required skill." }),
  location: z.string().min(1, { message: "Please select the job location/city." }),
  duration: z.string().min(1, { message: "Please select the job duration." }),
  budget: z.string().optional(),
});

type JobPostFormValues = z.infer<typeof jobPostFormSchema>;

interface JobPostFormProps {
  job?: Job;
  isEditing?: boolean;
}

export function JobPostForm({ job, isEditing = false }: JobPostFormProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const form = useForm<JobPostFormValues>({
    resolver: zodResolver(jobPostFormSchema),
    defaultValues: job ? {
      title: job.title,
      description: job.description || "",
      requiredSkill: job.requiredSkill,
      location: job.location,
      duration: job.duration,
      budget: job.budget || "",
      descriptionKeywords: "",
    } : {
      title: "",
      descriptionKeywords: "",
      description: "",
      requiredSkill: "",
      location: "",
      duration: "",
      budget: "",
    },
  });

  const handleGenerateDescription = async () => {
    const keywords = form.getValues("descriptionKeywords");
    if (!keywords || keywords.length < 10) {
      toast({ title: "Keywords too short", description: "Please provide more keywords for AI description generation.", variant: "destructive" });
      return;
    }
    setIsAiGenerating(true);
    try {
      const result = await genJobDescAiFlow({ keywords });
      form.setValue("description", result.jobDescription);
      toast({ title: "Description Generated!", description: "AI has drafted a job description for you." });
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({ title: "AI Generation Failed", description: "Could not generate description. Please try again or write manually.", variant: "destructive" });
    } finally {
      setIsAiGenerating(false);
    }
  };

  async function onSubmit(data: JobPostFormValues) {
    if (!userData || userData.role !== 'customer') {
      toast({ title: "Unauthorized", description: "You must be a customer to post jobs.", variant: "destructive"});
      return;
    }
    setIsLoading(true);

    const jobDataPayload = {
      customerId: userData.uid,
      customerName: userData.name || "Unknown Customer",
      title: data.title,
      description: data.description,
      requiredSkill: data.requiredSkill,
      location: data.location,
      duration: data.duration,
      budget: data.budget || "",
      status: 'open' as Job['status'], // Changed for immediate visibility
      updatedAt: new Date().toISOString(),
      approvedByAdmin: true, // Changed for immediate visibility
    };
    
    console.log("[JobPostForm] Submitting job. ID (if editing):", job?.id);
    console.log("[JobPostForm] Payload:", JSON.parse(JSON.stringify(jobDataPayload)));


    try {
      if (isEditing && job?.id) {
        await db.collection("jobs").doc(job.id).update(jobDataPayload);
        console.log("[JobPostForm] Update call completed for job ID:", job.id);
        toast({ title: "Job Updated", description: "Your job post has been updated." });
      } else {
        const newJobRef = await db.collection("jobs").add({ ...jobDataPayload, createdAt: new Date().toISOString() });
        console.log("[JobPostForm] Add call completed. New job ID:", newJobRef.id);
        toast({ title: "Job Posted", description: "Your job post is now live." });
      }
      router.push("/customer/jobs");
    } catch (error: any) {
      console.error("Job Post/Update Error:", error);
      toast({
        title: isEditing ? "Update Failed" : "Posting Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{isEditing ? "Edit Job Post" : "Create a New Job Post"}</CardTitle>
        <CardDescription>{isEditing ? "Update the details of your job post." : "Fill in the details below to find the right talent for your project."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Experienced Plumber for Residential Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
             <FormField
                control={form.control}
                name="descriptionKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords for AI Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., need electrician, commercial building, wiring, 2 weeks, urgent" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide some keywords, and our AI can help draft a job description for you.
                    </FormDescription>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isAiGenerating}>
                      {isAiGenerating ? <Loader className="mr-2" size={14} /> : null}
                      Generate with AI
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detailed description of the job, responsibilities, requirements, etc." {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="requiredSkill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skill</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select required skill" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteConfig.skills.map(skill => (
                          <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (City)</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteConfig.cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteConfig.jobDurations.map(duration => (
                          <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ₹5000 - ₹7000 or Negotiable" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isAiGenerating}>
              {isLoading ? <Loader className="mr-2" size={16} /> : null}
              {isEditing ? "Update Job Post" : "Post Job"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
