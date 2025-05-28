
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader } from "@/components/ui/loader";
import type { UserProfile } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase"; // Using new mock db

const labourProfileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().optional().refine(val => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
    message: "Please enter a valid phone number (e.g., +911234567890 or 1234567890).",
  }),
  roleType: z.string().min(1, { message: "Please select your primary role." }),
  skills: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one skill.",
  }),
  city: z.string().min(1, { message: "Please select your city." }),
  availability: z.boolean().default(false),
  currentWorkSites: z.string().optional(),
  pastWorkSites: z.string().optional(),
});

type LabourProfileFormValues = z.infer<typeof labourProfileFormSchema>;

export function LabourProfileForm() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LabourProfileFormValues>({
    resolver: zodResolver(labourProfileFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      roleType: "",
      skills: [],
      city: "",
      availability: false,
      currentWorkSites: "",
      pastWorkSites: "",
    },
  });

  useEffect(() => {
    if (userData) {
      console.log("[LabourProfileForm] useEffect updating form with userData:", JSON.parse(JSON.stringify(userData)));
      form.reset({
        name: userData.name || "",
        phone: userData.phone || "",
        roleType: userData.roleType || "",
        skills: userData.skills || [],
        city: userData.city || "",
        availability: userData.availability || false,
        currentWorkSites: userData.currentWorkSites?.join(", ") || "",
        pastWorkSites: userData.pastWorkSites?.join(", ") || "",
      });
    }
  }, [userData, form]);

  async function onSubmit(data: LabourProfileFormValues) {
    if (!userData) return;
    setIsLoading(true);
    console.log("[LabourProfileForm] Submitting profile data:", JSON.parse(JSON.stringify(data)));
    console.log("[LabourProfileForm] Submitting city:", data.city);


    const profileDataToUpdate: Partial<UserProfile> = {
      name: data.name,
      phone: data.phone,
      roleType: data.roleType,
      skills: data.skills,
      city: data.city,
      availability: data.availability,
      currentWorkSites: data.currentWorkSites?.split(",").map(s => s.trim()).filter(s => s) || [],
      pastWorkSites: data.pastWorkSites?.split(",").map(s => s.trim()).filter(s => s) || [],
      updatedAt: new Date().toISOString(),
    };
    
    console.log("[LabourProfileForm] profileDataToUpdate payload:", JSON.parse(JSON.stringify(profileDataToUpdate)));


    try {
      await db.collection("users").doc(userData.uid).update(profileDataToUpdate);
      await refreshUserData();
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Profile Update Error:", error);
      toast({
        title: "Update Failed",
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
        <CardTitle className="text-2xl font-bold">Your Labour Profile</CardTitle>
        <CardDescription>Keep your information up-to-date to get the best job matches.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+911234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="roleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Role (e.g., Electrician, Mason)</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary role" />
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
              name="skills"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Skills</FormLabel>
                    <FormDescription>
                      Select all skills that apply to you.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {siteConfig.skills.map((skill) => (
                    <FormField
                      key={skill}
                      control={form.control}
                      name="skills"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={skill}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(skill)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), skill])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== skill
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {skill}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city" />
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
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Availability</FormLabel>
                    <FormDescription>
                      Are you currently available for new projects?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentWorkSites"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Working Sites (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Phoenix Mall Project, Skyview Apartments (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>List sites you are currently working on.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pastWorkSites"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Past Working Sites (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., City Center Tower, Greenfield Residential (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>List some notable past projects or sites.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader className="mr-2" size={16} /> : null}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
