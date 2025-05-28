import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  className?: string;
  size?: number;
}

export function Loader({ className, size = 24 }: LoaderProps) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      size={size}
    />
  );
}

export function PageLoader({ message = "Loading..."}: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader size={48} />
      {message && <p className="mt-4 text-muted-foreground">{message}</p>}
    </div>
  );
}
