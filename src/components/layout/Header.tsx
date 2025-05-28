
"use client";

import Link from "next/link";
import { Building2, LogIn, LogOut, Menu, X, UserCircle2, LayoutDashboard, Briefcase, CreditCard } from "lucide-react"; 
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
import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import React from "react";

export function Header() {
  const { user, userData, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getInitials = (name?: string) => {
    if (!name) return "U"; // Default for User if name is not yet available
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length -1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const userRole = userData?.role;
  // Ensure userNavItems correctly uses icons from siteConfig
  const userNavItems = userRole && userData ? siteConfig.userNav[userRole].map(item => {
    let IconComponent;
    if (item.title === "Dashboard") IconComponent = LayoutDashboard;
    else if (item.title === "My Profile") IconComponent = UserCircle2;
    else if (item.title === "My Applications" || item.title === "Post a Job" || item.title === "My Job Posts") IconComponent = Briefcase;
    else if (item.title === "Subscription") IconComponent = CreditCard;
    // Add more else if for other admin icons as needed
    return { ...item, icon: IconComponent };
  }) : [];


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 ml-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            {siteConfig.name}
          </span>
        </Link>

        <div className="flex items-center">
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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

          <div className="hidden md:flex items-center space-x-2 ml-4">
            {loading ? (
              <Skeleton className="h-9 w-24 rounded-md" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full mr-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userData?.profilePhotoUrl || undefined} alt={userData?.name || "User"} data-ai-hint="user profile" />
                      <AvatarFallback>{getInitials(userData?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userData?.email || (user && user.email) || "No email"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userNavItems.map(item => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>
                        {item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4"})}
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {(user && userNavItems.length > 0) && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="mr-2">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login / Sign Up
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden ml-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="mr-2">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 bg-background border-b border-border/40 p-4 shadow-md supports-[backdrop-filter]:bg-background/90">
          <nav className="flex flex-col space-y-1">
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.title}
              </Link>
            ))}
            
            <div className="my-2 border-t border-border/60"></div>

            {loading ? (
                <Skeleton className="h-8 w-full rounded-md my-1" /> 
            ) : user ? ( 
              <>
                {userData && <DropdownMenuLabel className="px-3 pt-2 text-xs text-muted-foreground">Welcome, {userData.name}</DropdownMenuLabel>}
                
                {userNavItems.length > 0 && userNavItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4"})}
                    {item.title}
                  </Link>
                ))}
                {(userNavItems.length > 0) && <div className="my-2 border-t border-border/60"></div>}
                 <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center w-full text-left rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login / Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

