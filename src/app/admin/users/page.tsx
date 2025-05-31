
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { UserProfile } from "@/types";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserX, UserCheck, Search, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await db.collection("users").get();
      const usersData = usersSnapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as UserProfile))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newDisabledStatus = !user.disabled;
    try {
      await db.collection("users").doc(user.uid).update({ disabled: newDisabledStatus, updatedAt: new Date().toISOString() });
      toast({
        title: `User ${newDisabledStatus ? "Disabled" : "Enabled"}`,
        description: `${user.name}'s account has been ${newDisabledStatus ? "disabled" : "enabled"}.`,
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({ title: "Error", description: "Could not update user status.", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
              <p className="text-muted-foreground">View and manage all platform users.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                 <div className="mt-2 mb-4">
                    <Search className="absolute h-5 w-5 text-muted-foreground mt-2.5 ml-3 pointer-events-none" />
                    <Input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 lg:w-1/3 pl-10 p-2 border rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading users...</p></div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No users found{searchTerm ? " matching your search" : ""}.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.uid} className={user.disabled ? "opacity-60 bg-muted/30" : ""}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'customer' ? 'secondary' : 'default'}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatRelativeDate(user.createdAt)}</TableCell>
                          <TableCell>
                            {user.disabled ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">Disabled</Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-500 text-green-600">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.role !== 'admin' ? (
                                <Button
                                variant={user.disabled ? "default" : "destructive"}
                                size="sm"
                                onClick={() => handleToggleUserStatus(user)}
                                className={user.disabled ? "bg-green-500 hover:bg-green-600 text-white" : "bg-destructive/80 hover:bg-destructive"}
                                >
                                {user.disabled ? <UserCheck className="mr-1 h-4 w-4" /> : <UserX className="mr-1 h-4 w-4" />}
                                {user.disabled ? "Enable" : "Disable"}
                                </Button>
                            ) : (
                                <Badge variant="secondary" className="cursor-not-allowed"><ShieldAlert className="mr-1 h-3 w-3"/> Admin</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
