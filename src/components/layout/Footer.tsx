
"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Building2 } from "lucide-react";
import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

export function Footer() {
  const [currentYear, setCurrentYear] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This ensures this code runs only on the client, after initial hydration
    setCurrentYear(new Date().getFullYear().toString());
    setIsMounted(true);
  }, []);


  return (
    <footer className="border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Building2 className={cn(
              "h-6 w-6 text-primary hidden md:block",
              isMounted && "md:ml-2" // Apply margin only after mount
            )} />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
          {siteConfig.footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
