
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function FloatingThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light'); // Default to light to avoid undefined state

  useEffect(() => {
    // This effect runs only on the client after hydration
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const preferredTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setCurrentTheme(preferredTheme);
    if (preferredTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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

