
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function FloatingThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    // Check for window to ensure it's client-side for matchMedia
    if (typeof window !== 'undefined') {
        const preferredTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setCurrentTheme(preferredTheme);
        if (preferredTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    }
  }, []);

  const toggleTheme = () => {
    setCurrentTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  // Avoid rendering on server or during initial client hydration before theme is determined
  if (typeof window === 'undefined' && !currentTheme) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg border bg-background/80 backdrop-blur hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle theme"
    >
      {currentTheme === 'light' ? <Moon className="h-[1.5rem] w-[1.5rem]" /> : <Sun className="h-[1.5rem] w-[1.5rem]" />}
    </Button>
  );
}
