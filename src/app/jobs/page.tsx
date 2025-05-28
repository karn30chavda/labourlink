
"use client";

import { JobCard } from "@/components/jobs/JobCard";
import type { Application, Job, UserProfile } from "@/types";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; 
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { PageLoader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function JobsPage() {
  const { userData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchJobsAndApplications = async () => {
      if (!db) { // Check if db is available
        setLoading(false);
        console.error("Firestore instance (db) is not available.");
        return;
      }
      setLoading(true);
      try {
        const jobsQuery = query(
          collection(db, "jobs"),
          where("status", "==", "open"),
          where("approvedByAdmin", "==", true),
          orderBy("createdAt", "desc") 
        );
        const jobsSnapshot = await getDocs(jobsQuery); 

        const jobsData = jobsSnapshot.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Job));
        setJobs(jobsData);
        setFilteredJobs(jobsData);

        if (userData?.role === 'labour' && userData.uid) {
          const appsQuery = query(collection(db, "applications"), where("labourId", "==", userData.uid));
          const appsSnapshot = await getDocs(appsQuery);
          const ids = new Set<string>();
          appsSnapshot.docs.forEach(docSnap => {
            const appData = docSnap.data() as Application;
            ids.add(appData.jobId);
          });
          setAppliedJobIds(ids);
        }

      } catch (error) {
        console.error("Error fetching jobs/applications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobsAndApplications();
  }, [userData]);

  useEffect(() => {
    let tempJobs = jobs;
    if (searchTerm) {
      tempJobs = tempJobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedSkill) {
      tempJobs = tempJobs.filter(job => job.requiredSkill === selectedSkill);
    }
    if (selectedLocation) {
      tempJobs = tempJobs.filter(job => job.location === selectedLocation);
    }
    setFilteredJobs(tempJobs);
  }, [searchTerm, selectedSkill, selectedLocation, jobs]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSkill("");
    setSelectedLocation("");
  };
  
  const handleApplicationSubmitted = (jobId: string) => {
    setAppliedJobIds(prev => new Set(prev).add(jobId));
  };


  if (loading) {
    return <PageLoader message="Loading available jobs..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Find Your Next Project</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Browse through a wide range of construction job opportunities.
        </p>
      </div>

      <div className="mb-8 p-6 bg-card rounded-xl shadow-md border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search-term" className="block text-sm font-medium text-muted-foreground mb-1">Search by Keyword</label>
            <Input
              id="search-term"
              type="text"
              placeholder="Job title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
          </div>
          <div>
            <label htmlFor="skill-filter" className="block text-sm font-medium text-muted-foreground mb-1">Filter by Skill</label>
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger id="skill-filter" className="h-10">
                <SelectValue placeholder="All Skills" />
              </SelectTrigger>
              <SelectContent>
                {siteConfig.skills.map(skill => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="location-filter" className="block text-sm font-medium text-muted-foreground mb-1">Filter by Location</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="location-filter" className="h-10">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {siteConfig.cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || selectedSkill || selectedLocation) && (
             <Button onClick={clearFilters} variant="ghost" className="w-full md:w-auto lg:col-start-4">
                <X className="mr-2 h-4 w-4"/> Clear Filters
            </Button>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold text-foreground">No Jobs Found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search filters or check back later for new postings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard 
                key={job.id} 
                job={job} 
                hasApplied={appliedJobIds.has(job.id!)} // Ensure job.id is not undefined
                onApplySuccess={handleApplicationSubmitted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
