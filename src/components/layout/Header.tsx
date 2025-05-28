"use client";

import Link from "next/link";
import { Building2, LogIn, LogOut, UserPlus, UserCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function Header() {
  const { user, userData, loading, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return "NN";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const userRole = userData?.role;
  const userNavItems = userRole ? siteConfig.userNav[userRole] : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {siteConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-2">
          {loading ? (
            <Skeleton className="h-9 w-24 rounded-md" />
          ) : user && userData ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userData.profilePhotoUrl || undefined} alt={userData.name || "User"} data-ai-hint="user profile" />
                    <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userData.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {userNavItems.map(item => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                       {/*  <LayoutDashboard className="mr-2 h-4 w-4" /> Placeholder icon, specific icons can be added*/}
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  <UserPlus className="mr-2 h-4 w-4" /> Register
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
