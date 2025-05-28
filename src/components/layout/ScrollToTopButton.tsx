
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    // Ensure window is defined (runs only on client)
    if (typeof window !== "undefined") {
      if (window.pageYOffset > 200) { // Show button after scrolling 200px
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  };

  const scrollToTop = () => {
    // Ensure window is defined (runs only on client)
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    // Ensure window is defined (runs only on client)
    if (typeof window !== "undefined") {
        window.addEventListener("scroll", toggleVisibility);
        // Call it once to set initial state
        toggleVisibility(); 
        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-20 right-5 z-50 h-12 w-12 rounded-full shadow-lg border bg-background/80 backdrop-blur hover:bg-accent hover:text-accent-foreground transition-opacity duration-300 print:hidden",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ArrowUp className="h-[1.5rem] w-[1.5rem]" />
    </Button>
  );
}

