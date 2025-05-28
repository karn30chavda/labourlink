
"use client";

import { LabourCard } from "@/components/labour/LabourCard";
import type { UserProfile } from "@/types";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // Using MOCK Firebase
import { PageLoader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Search, X, Users } from "lucide-react";

export default function SearchLabourPage() {
  const [labours, setLabours] = useState<UserProfile[]>([]);
  const [filteredLabours, setFilteredLabours] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    const fetchLabours = async () => {
      setLoading(true);
      try {
        const laboursSnapshot = await db.collection("users").where("role", "==", "labour").get();
        const laboursData = laboursSnapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() } as UserProfile));
        
        setLabours(laboursData);
        setFilteredLabours(laboursData); 
      } catch (error) {
        console.error("Error fetching labours:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabours();
  }, []);

  useEffect(() => {
    let tempLabours = labours;
    if (searchTerm) {
      tempLabours = tempLabours.filter(labour =>
        labour.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedSkill) {
      tempLabours = tempLabours.filter(labour => labour.skills?.includes(selectedSkill));
    }
    if (selectedCity) {
      tempLabours = tempLabours.filter(labour => labour.city === selectedCity);
    }
    if (onlyAvailable) {
      tempLabours = tempLabours.filter(labour => labour.availability === true);
    }
    setFilteredLabours(tempLabours);
  }, [searchTerm, selectedSkill, selectedCity, onlyAvailable, labours]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSkill("");
    setSelectedCity("");
    setOnlyAvailable(false);
  };


  if (loading) {
    return <PageLoader message="Finding skilled labour..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Find Skilled Labour</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Search and connect with verified construction professionals.
        </p>
      </div>

      <div className="mb-8 p-6 bg-card rounded-xl shadow-md border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search-name" className="block text-sm font-medium text-muted-foreground mb-1">Search by Name</label>
            <Input
              id="search-name"
              type="text"
              placeholder="Labour name..."
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
            <label htmlFor="city-filter" className="block text-sm font-medium text-muted-foreground mb-1">Filter by City</label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger id="city-filter" className="h-10">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                {siteConfig.cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox 
              id="availability-filter"
              checked={onlyAvailable}
              onCheckedChange={(checked) => setOnlyAvailable(checked as boolean)}
            />
            <Label htmlFor="availability-filter" className="text-sm font-medium">
              Show only available
            </Label>
          </div>
           {(searchTerm || selectedSkill || selectedCity || onlyAvailable) && (
             <Button onClick={clearFilters} variant="ghost" className="w-full md:w-auto md:col-start-2 lg:col-start-4">
                <X className="mr-2 h-4 w-4"/> Clear Filters
            </Button>
          )}
        </div>
      </div>

      {filteredLabours.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold text-foreground">No Labour Found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search filters or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabours.map((labour) => (
            <LabourCard key={labour.uid} labour={labour} />
          ))}
        </div>
      )}
    </div>
  );
}
