
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { DirectJobOffer, Job } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Check, Gift, Loader2, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase"; 
import { formatRelativeDate, formatFullDate } from '@/lib/utils';

export default function LabourJobOffersPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [jobOffers, setJobOffers] = useState<DirectJobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOnOffer, setActingOnOffer] = useState<string | null>(null); // Offer ID being acted upon

  useEffect(() => {
    const fetchJobOffers = async () => {
      if (!userData?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const offersSnapshot = await db.collection("directJobOffers")
            .where("labourId", "==", userData.uid)
            .get();
        
        const offersData = offersSnapshot.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() } as DirectJobOffer))
            .sort((a: DirectJobOffer, b: DirectJobOffer) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setJobOffers(offersData);
      } catch (error) {
        console.error("Error fetching job offers:", error);
        toast({ title: "Error", description: "Could not fetch your job offers.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (userData?.uid) {
      fetchJobOffers();
    }
  }, [userData?.uid, toast]);

  const handleOfferResponse = async (offer: DirectJobOffer, response: 'accepted_by_labour' | 'rejected_by_labour') => {
    if (!userData?.uid) return;
    setActingOnOffer(offer.id);
    try {
      // Update DirectJobOffer status
      await db.collection("directJobOffers").doc(offer.id).update({ 
        offerStatus: response, 
        updatedAt: new Date().toISOString() 
      });

      if (response === 'accepted_by_labour') {
        // Update the original Job status
        await db.collection("jobs").doc(offer.jobId).update({
          status: 'assigned',
          assignedLabourId: userData.uid,
          updatedAt: new Date().toISOString()
        });
        toast({ title: "Offer Accepted!", description: `You have accepted the offer for "${offer.jobTitle}".` });
      } else {
        toast({ title: "Offer Rejected", description: `You have rejected the offer for "${offer.jobTitle}".` });
      }

      // Refresh local state
      setJobOffers(prevOffers => 
        prevOffers.map(o => 
          o.id === offer.id ? { ...o, offerStatus: response, updatedAt: new Date().toISOString() } : o
        )
      );

    } catch (error) {
       console.error("Error responding to offer:", error);
       toast({ title: "Error", description: "Could not process your response.", variant: "destructive" });
    } finally {
        setActingOnOffer(null);
    }
  };
  

  const getStatusBadgeVariant = (status: DirectJobOffer['offerStatus']) => {
    switch (status) {
      case 'pending_labour_response': return 'secondary';
      case 'accepted_by_labour': return 'default'; 
      case 'rejected_by_labour': return 'destructive';
      default: return 'outline';
    }
  };
   const getStatusBadgeClass = (status: DirectJobOffer['offerStatus']) => {
    switch (status) {
      case 'accepted_by_labour': return 'bg-green-500 text-white';
      case 'rejected_by_labour': return 'bg-destructive text-destructive-foreground';
      default: return '';
    }
  };

  const pendingOffers = jobOffers.filter(o => o.offerStatus === 'pending_labour_response');
  const actionedOffers = jobOffers.filter(o => o.offerStatus !== 'pending_labour_response');


  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["labour"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Job Offers</h1>
              <p className="text-muted-foreground">Respond to direct job offers from customers.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/labour/dashboard"><Briefcase className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3 text-lg">Loading your job offers...</p></div>
          ) : (
            <>
              {pendingOffers.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Pending Your Response</h2>
                  <div className="space-y-6">
                    {pendingOffers.map(offer => (
                      <Card key={offer.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg">{offer.jobTitle || "Job Title Missing"}</CardTitle>
                            <CardDescription>
                            Offered by: {offer.customerName || "A Customer"} | Received: {formatRelativeDate(offer.createdAt)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {offer.jobDescription && <p className="text-sm text-muted-foreground line-clamp-3 mb-2">Details: {offer.jobDescription}</p>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <p className="text-muted-foreground">Skill: {offer.jobRequiredSkill || "N/A"}</p>
                                <p className="text-muted-foreground">Location: {offer.jobLocation || "N/A"}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t pt-4">
                           <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOfferResponse(offer, 'accepted_by_labour')}
                                disabled={actingOnOffer === offer.id}
                                className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                                {actingOnOffer === offer.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Accept
                            </Button>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleOfferResponse(offer, 'rejected_by_labour')}
                                disabled={actingOnOffer === offer.id}
                                className="bg-destructive/80 hover:bg-destructive"
                            >
                                {actingOnOffer === offer.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />} Reject
                            </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {actionedOffers.length > 0 && (
                 <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Offer History</h2>
                    <div className="space-y-4">
                    {actionedOffers.map(offer => (
                        <Card key={offer.id} className="opacity-70">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                <CardTitle className="text-md">{offer.jobTitle || "Job Title Missing"}</CardTitle>
                                <Badge 
                                    variant={getStatusBadgeVariant(offer.offerStatus)}
                                    className={getStatusBadgeClass(offer.offerStatus)}
                                >
                                    {offer.offerStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                </div>
                                <CardDescription>
                                From: {offer.customerName || "A Customer"} | Last updated: {formatRelativeDate(offer.updatedAt || offer.createdAt)}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                    </div>
                 </div>
              )}

              {jobOffers.length === 0 && (
                <Card className="text-center py-12">
                    <CardHeader>
                    <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <CardTitle className="text-2xl font-semibold text-foreground">No Job Offers Yet</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-muted-foreground mt-2">
                        When customers send you direct job offers, they will appear here. 
                        Keep your profile updated and browse jobs to get noticed!
                    </p>
                    <Button variant="default" asChild className="mt-6">
                        <Link href="/jobs"><Search className="mr-2 h-4 w-4"/>Find Jobs</Link>
                    </Button>
                    </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
