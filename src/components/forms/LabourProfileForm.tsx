
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
import { db, storage } from "@/lib/firebase"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadCloud } from "lucide-react";

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
  profilePhotoUrl: z.string().url().optional().nullable(),
  newProfilePhoto: z.instanceof(File).optional().nullable(),
});

type LabourProfileFormValues = z.infer<typeof labourProfileFormSchema>;

export function LabourProfileForm() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      profilePhotoUrl: null,
      newProfilePhoto: null,
    },
  });

  useEffect(() => {
    console.log("[LabourProfileForm] useEffect triggered. Current userData:", userData ? JSON.parse(JSON.stringify(userData)) : userData);
    if (userData) {
      const resetValues = {
        name: userData.name || "",
        phone: userData.phone || "",
        roleType: userData.roleType || "",
        skills: userData.skills || [],
        city: userData.city || "",
        availability: userData.availability || false,
        currentWorkSites: Array.isArray(userData.currentWorkSites) ? userData.currentWorkSites.join(", ") : userData.currentWorkSites || "",
        pastWorkSites: Array.isArray(userData.pastWorkSites) ? userData.pastWorkSites.join(", ") : userData.pastWorkSites || "",
        profilePhotoUrl: userData.profilePhotoUrl || null, 
        newProfilePhoto: null, 
      };
      console.log("[LabourProfileForm] Resetting form with values:", JSON.parse(JSON.stringify(resetValues)));
      form.reset(resetValues);
      console.log("[LabourProfileForm] Attempting to set imagePreview with userData.profilePhotoUrl:", userData.profilePhotoUrl);
      setImagePreview(userData.profilePhotoUrl || null);
    } else {
        console.log("[LabourProfileForm] useEffect triggered but userData is null/undefined. Resetting form to defaults.");
        form.reset({ name: "", phone: "", roleType: "", skills: [], city: "", availability: false, currentWorkSites: "", pastWorkSites: "", profilePhotoUrl: null, newProfilePhoto: null });
        setImagePreview(null);
    }
  }, [userData, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("newProfilePhoto", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("newProfilePhoto", null);
      // When file input is cleared, revert preview to the currently saved profilePhotoUrl from form state
      // This form state value should have been set by form.reset() in the useEffect based on userData
      setImagePreview(form.getValues("profilePhotoUrl")); 
    }
  };

  async function onSubmit(data: LabourProfileFormValues) {
    if (!userData?.uid) {
        toast({ title: "Error", description: "User not found. Cannot update profile.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    console.log("[LabourProfileForm] Submitting form data:", JSON.parse(JSON.stringify(data)));
    console.log("[LabourProfileForm] Submitting city:", data.city);

    let uploadedPhotoUrl = data.profilePhotoUrl; // Start with existing or null

    if (data.newProfilePhoto) {
        try {
            // Simulate upload to mock storage
            const storageRef = storage.ref(`profilePictures/${userData.uid}/${data.newProfilePhoto.name}`);
            const uploadTask = await storageRef.put(data.newProfilePhoto as File); // Cast to File for mock
            uploadedPhotoUrl = await uploadTask.snapshot.ref.getDownloadURL(); // This will be the NEW mock URL
            toast({ title: "Profile Picture Updated", description: "New picture 'uploaded' (mock)." });
        } catch (error) {
            console.error("Mock image upload error:", error);
            toast({ title: "Image Upload Failed", description: "Could not 'upload' image (mock).", variant: "destructive" });
            setIsLoading(false);
            return;
        }
    }

    const profileDataToUpdate: Partial<UserProfile> = {
      name: data.name,
      phone: data.phone,
      roleType: data.roleType,
      skills: data.skills,
      city: data.city,
      availability: data.availability,
      currentWorkSites: data.currentWorkSites?.split(",").map(s => s.trim()).filter(s => s) || [],
      pastWorkSites: data.pastWorkSites?.split(",").map(s => s.trim()).filter(s => s) || [],
      profilePhotoUrl: uploadedPhotoUrl, // This will be the NEW mock URL if a new photo was "uploaded", or the existing one if not.
      updatedAt: new Date().toISOString(),
    };
    
    console.log("[LabourProfileForm] profileDataToUpdate payload:", JSON.parse(JSON.stringify(profileDataToUpdate)));

    try {
      await db.collection("users").doc(userData.uid).update(profileDataToUpdate);
      await refreshUserData(); // This fetches the updated data and sets userData in context
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
      // The form field newProfilePhoto is correctly reset to null by the useEffect -> form.reset
      // after userData is refreshed and the component re-renders.
    }
  }
  
  const getInitials = (name?: string) => {
    if (!name || name.trim() === "") return "NN";
    const names = name.trim().split(' ').filter(n => n); 
    if (names.length === 0) return "NN";
    if (names.length > 1 && names[0] && names[names.length -1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
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
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
                <AvatarImage src={imagePreview || undefined} alt={userData?.name} data-ai-hint="profile preview" />
                <AvatarFallback className="text-3xl">
                  {getInitials(form.getValues("name") || userData?.name)}
                </AvatarFallback>
              </Avatar>
              <FormField
                control={form.control}
                name="newProfilePhoto"
                render={() => ( // field isn't directly used for <Input type="file"> with custom handler
                  <FormItem className="w-full max-w-xs">
                    <FormLabel htmlFor="profile-picture-upload" className="sr-only">Upload new profile picture</FormLabel>
                    <FormControl>
                      <div className="relative mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                        <div className="space-y-1 text-center">
                          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                          <div className="flex text-sm text-muted-foreground">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                            >
                              <span>Upload a file</span>
                              <Input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={handleFileChange} // Use custom handler
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB (mock)</p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                   <Select onValueChange={field.onChange} value={field.value || ""}>
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
                   <Select onValueChange={field.onChange} value={field.value || ""}>
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

