
"use client";

import Link from "next/link";
import { Building2, LogIn, LogOut, UserPlus, LayoutDashboard, Menu, X } from "lucide-react";
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

export function Header() {
  const { user, userData, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo and Site Name */}
        <Link href="/" className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            {siteConfig.name}
          </span>
        </Link>

        {/* Right Aligned Items Wrapper */}
        <div className="flex items-center">
          {/* Desktop Navigation (hidden on mobile) */}
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

          {/* Authentication Section (Login/Register or User Dropdown) */}
          <div className="flex items-center space-x-2 ml-0 md:ml-6">
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
                        {/* Specific icons can be added to siteConfig if needed */}
                        {/* <LayoutDashboard className="mr-2 h-4 w-4" /> */}
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
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" /> Register
                  </Link>
                </Button>
                 {/* Simplified for very small screens if needed, or rely on mobile menu */}
                <Button variant="ghost" asChild className="sm:hidden">
                  <Link href="/login"><LogIn className="h-5 w-5" /></Link>
                </Button>
                <Button asChild size="icon" className="sm:hidden">
                  <Link href="/register"><UserPlus className="h-5 w-5" /></Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button (visible on mobile only) */}
          <div className="md:hidden ml-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (conditionally rendered) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 p-4 shadow-md">
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
            {user && userData && userNavItems.length > 0 && (
              <>
                <div className="my-2 border-t border-border/60"></div> {/* Simple separator */}
                {/* <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">My Account</p> */}
                {userNavItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </>
            )}
             {!user && !loading && (
              <>
                <div className="my-2 border-t border-border/60"></div>
                <Link
                  href="/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
