
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">About LabourLink</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Connecting Skilled Labour with Opportunity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Image
              src="https://placehold.co/600x300.png"
              alt="Team working together"
              width={600}
              height={300}
              className="rounded-lg shadow-md object-cover"
              data-ai-hint="team collaboration construction"
            />
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to LabourLink, your premier platform for connecting skilled construction professionals
            with customers who need their expertise. Our mission is to bridge the gap in the construction
            industry by providing a seamless, efficient, and reliable marketplace for labour and project owners.
          </p>
          <h2 className="text-2xl font-semibold text-foreground pt-4">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            We envision a world where finding skilled construction labour or your next project is just a few clicks away.
            LabourLink aims to empower workers by providing them with consistent opportunities and to help customers
            build their dreams by connecting them with verified, high-quality talent.
          </p>
          <h2 className="text-2xl font-semibold text-foreground pt-4">What We Do</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
            <li>Provide a user-friendly platform for customers to post job requirements.</li>
            <li>Enable skilled labours to create detailed profiles showcasing their expertise and availability.</li>
            <li>Facilitate easy searching and filtering for both jobs and labour.</li>
            <li>Utilize AI-powered matching to suggest relevant opportunities and candidates.</li>
            <li>Offer a secure and transparent environment for all users.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed pt-4">
            At LabourLink, we are passionate about construction and technology. We believe that by combining these two,
            we can create a more productive and prosperous future for everyone in the industry.
          </p>
          <div className="text-center pt-6">
            <Button asChild size="lg">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
