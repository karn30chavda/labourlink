
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, CheckSquare, DollarSign, Users, Briefcase } from "lucide-react";
import Link from "next/link";

// Mock data for admin dashboard - can be fetched dynamically later
const mockAdminStats = {
  totalUsers: 152, // This will be dynamic from DB
  totalJobsPosted: 210, // This will be dynamic from DB
  // Removed pendingApprovals and totalPayments as corresponding pages are not implemented yet
};

export default function AdminDashboardPage() {
  const { userData } = useAuth(); // Though not directly used here, good for context

  const adminCards = [
    { title: "Total Users", value: mockAdminStats.totalUsers, icon: <Users className="h-6 w-6 text-primary" />, href: "/admin/users", description: "All registered users" },
    { title: "Total Jobs", value: mockAdminStats.totalJobsPosted, icon: <Briefcase className="h-6 w-6 text-primary" />, href: "/admin/jobs", description: "Jobs posted on platform" },
    // { title: "Pending Approvals", value: mockAdminStats.pendingApprovals, icon: <CheckSquare className="h-6 w-6 text-orange-500" />, href: "/admin/approvals", description: "Jobs awaiting review" },
    // { title: "Total Payments", value: mockAdminStats.totalPayments, icon: <DollarSign className="h-6 w-6 text-green-500" />, href: "/admin/payments", description: "Successful transactions" },
  ];

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage LabourLink platform operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {adminCards.map((card, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold mb-1">{card.value}</p> {/* Value should be fetched */}
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={card.href}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Perform common administrative tasks.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild variant="secondary"><Link href="/admin/users">Manage Users</Link></Button>
                <Button asChild variant="secondary"><Link href="/admin/jobs">Manage Jobs</Link></Button>
                {/* <Button asChild variant="secondary"><Link href="/admin/approvals">Approve Posts</Link></Button> */}
                {/* <Button asChild variant="secondary"><Link href="/admin/payments">View Payments</Link></Button> */}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>System Health (Placeholder)</CardTitle>
                <CardDescription>Overview of platform activity.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placeholder for a chart or more stats */}
                <div className="flex items-center justify-center h-40 bg-muted/50 rounded-md">
                  <BarChart className="h-16 w-16 text-muted-foreground" />
                  <p className="ml-4 text-muted-foreground">User activity chart coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
