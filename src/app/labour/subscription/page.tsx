
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/firebase"; // Using MOCK Firebase
import { CheckCircle, CreditCard, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { format, addMonths, addYears } from 'date-fns';

export default function LabourSubscriptionPage() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const currentSubscription = userData?.subscription;
  const plans = siteConfig.paymentPlans.labour;

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!userData?.uid) {
      toast({ title: "Error", description: "User not found. Cannot update subscription.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSelectedPlanId(plan.id);

    try {
      // Simulate payment delay if needed
      // await new Promise(resolve => setTimeout(resolve, 1000)); 

      let validUntilDate;
      const now = new Date();
      if (plan.interval === "month") {
        validUntilDate = addMonths(now, 1);
      } else if (plan.interval === "year") {
        validUntilDate = addYears(now, 1);
      } else {
        validUntilDate = now; // Should not happen with current plans
      }

      const newSubscriptionDetails = {
        planId: plan.id,
        planType: plan.interval,
        status: 'active' as 'active',
        validUntil: validUntilDate.toISOString(),
      };

      await db.collection("users").doc(userData.uid).update({
        subscription: newSubscriptionDetails,
        updatedAt: new Date().toISOString(),
      });

      await refreshUserData(); 

      toast({
        title: "Subscription Activated!",
        description: `You are now subscribed to the ${plan.name} plan.`,
      });
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: "Could not update your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedPlanId(null);
    }
  };
  
  const getFormattedDate = (dateValue: any) => {
    if (!dateValue) return "N/A";
    try {
      return format(new Date(dateValue), 'PPP');
    } catch (e) {
      return "Invalid Date";
    }
  };


  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["labour"]}>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-3xl mx-auto shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">Labour Subscription</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Manage your access to job applications and premium features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {currentSubscription && currentSubscription.status !== 'none' ? (
                <Card className="bg-secondary/30">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      {currentSubscription.status === 'active' ? 
                        <CheckCircle className="h-6 w-6 text-green-500 mr-2" /> :
                        <ShieldAlert className="h-6 w-6 text-yellow-500 mr-2" /> 
                      }
                      Your Current Plan: {plans.find(p => p.id === currentSubscription.planId)?.name || currentSubscription.planId}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Status: <span className={`font-semibold ${currentSubscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{currentSubscription.status.toUpperCase()}</span></p>
                    {currentSubscription.validUntil && (
                       <p>Valid Until: {getFormattedDate(currentSubscription.validUntil)}</p>
                    )}
                     {currentSubscription.status !== 'active' && <p className="mt-2 text-sm text-destructive">Your subscription is not active. Please renew or choose a new plan to apply for jobs.</p>}
                  </CardContent>
                </Card>
              ) : (
                 <Card className="bg-destructive/10 border-destructive">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        <ShieldAlert className="h-6 w-6 text-destructive mr-2" /> 
                        No Active Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-destructive">You do not have an active subscription. Please choose a plan below to unlock job applications and other features.</p>
                  </CardContent>
                </Card>
              )}

              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">Choose Your Plan</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-primary">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-3xl font-bold text-foreground">
                          ₹{plan.price}
                          <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                          onClick={() => handleSubscribe(plan)}
                          disabled={isLoading || (currentSubscription?.planId === plan.id && currentSubscription?.status === 'active')}
                        >
                          {isLoading && selectedPlanId === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                          {currentSubscription?.planId === plan.id && currentSubscription?.status === 'active' ? 'Currently Active' : 'Subscribe Now'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
