import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <Image
          src="https://placehold.co/600x400.png"
          alt="404 Not Found"
          width={600}
          height={400}
          className="mb-8 rounded-lg shadow-md"
          data-ai-hint="sad robot construction worker"
        />
        <h1 className="text-5xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-foreground mb-6">
          Oops! Page Not Found.
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          It seems like the page you&apos;re looking for has taken a detour or doesn&apos;t exist.
          Let&apos;s get you back on track.
        </p>
        <Button asChild size="lg">
          <Link href="/">Go Back to Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
