
"use client";

import type { UserProfile } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, Phone, CheckCircle, XCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";


interface LabourCardProps {
  labour: UserProfile; 
}

export function LabourCard({ labour }: LabourCardProps) {
  const { toast } = useToast();
  const getInitials = (name?: string) => {
    if (!name) return "NN";
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length -1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Placeholder rating
  const rating = (Math.random() * (5 - 3.5) + 3.5).toFixed(1);


  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center space-x-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={labour.profilePhotoUrl || undefined} alt={labour.name} data-ai-hint="worker portrait" />
          <AvatarFallback>{getInitials(labour.name)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl font-semibold text-primary">
            {labour.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground pt-1">
            {labour.roleType || "Skilled Labour"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          <span>City: {labour.city || "Not specified"}</span>
        </div>
        <div className="flex items-center">
          <Briefcase className="h-4 w-4 mr-2 text-primary" />
          <span>Skills:</span>
        </div>
        {labour.skills && labour.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 pl-6">
            {labour.skills.slice(0, 5).map(skill => ( 
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
            {labour.skills.length > 5 && <Badge variant="outline">+{labour.skills.length - 5} more</Badge>}
          </div>
        ) : (
          <p className="pl-6 text-muted-foreground">No skills listed.</p>
        )}
        
        <div className="flex items-center pt-2">
          {labour.availability ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 mr-2 text-red-500" />
          )}
          <span>Availability: <span className={labour.availability ? "font-semibold text-green-600" : "font-semibold text-red-600"}>{labour.availability ? "Available" : "Busy"}</span></span>
        </div>
         <div className="flex items-center">
            <Star className="h-4 w-4 mr-2 text-amber-400" />
            <span>Rating: {rating}/5 (Placeholder)</span>
          </div>
      </CardContent>
      <CardFooter className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
        <Button size="sm" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => toast({title: "Contacting Labour", description: `Simulating contact with ${labour.name} (Phone: ${labour.phone || 'N/A'})`})}>
          <Phone className="mr-2 h-4 w-4" /> Contact
        </Button>
      </CardFooter>
    </Card>
  );
}

