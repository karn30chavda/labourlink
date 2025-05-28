import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Briefcase, Users, Zap, UserPlus, CircleCheckBig } from "lucide-react"; // Added CircleCheckBig
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Briefcase className="h-10 w-10 text-primary" />,
      title: "Post Jobs Easily",
      description: "Customers can quickly post job requirements and find skilled labour.",
      link: "/customer/post-job",
      linkText: "Post a Job",
      userType: "customer"
    },
    {
      icon: <Search className="h-10 w-10 text-primary" />,
      title: "Find Skilled Labour",
      description: "Browse profiles of verified construction workers with specific skills.",
      link: "/search-labour",
      linkText: "Find Labour",
      userType: "customer"
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Discover Opportunities",
      description: "Labours can find relevant job postings and apply with ease.",
      link: "/jobs",
      linkText: "Browse Jobs",
      userType: "labour"
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "AI-Powered Matching",
      description: "Our smart system suggests the best labour for your job or notifies you of relevant jobs.",
      link: "#ai-features", // Placeholder link
      linkText: "Learn More",
      userType: "all"
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Connect. Build. Succeed.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            LabourLink is your premier marketplace for connecting skilled construction labour with customers needing their expertise.
            Streamline your hiring or find your next project today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/jobs">Find Work (For Labour)</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/search-labour">Hire Labour (For Customers)</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            How LabourLink Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">1. Register & Create Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sign up as Labour or Customer. Labours showcase skills, Customers detail needs.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">2. Post or Find Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Customers post jobs. Labours search and apply for relevant projects.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <CircleCheckBig className="h-8 w-8 text-primary" /> {/* Corrected from CheckCircle */}
                </div>
                <CardTitle className="text-xl font-semibold">3. Connect & Get to Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Direct communication and AI matching help finalize hires quickly and efficiently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ai-features" className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mb-4 flex justify-center">{feature.icon}</div>
                  <CardTitle className="text-xl font-semibold text-center">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-center">{feature.description}</CardDescription>
                </CardContent>
                {/* 
                Conditional Link based on user type could be added later if needed, for now simple links
                <CardFooter>
                  <Button variant="link" asChild className="mx-auto text-primary">
                    <Link href={feature.link}>{feature.linkText}</Link>
                  </Button>
                </CardFooter> 
                */}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join LabourLink today and be part of the future of construction hiring.
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/register">Sign Up Now</Link>
          </Button>
        </div>
      </section>
      
      {/* Placeholder image section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Building the Future, Together
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Image 
                src="https://placehold.co/600x400.png"
                alt="Construction site with workers"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover w-full"
                data-ai-hint="labour image" 
              />
            </div>
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                LabourLink is committed to fostering a community where skilled professionals and project owners can connect seamlessly. Our platform leverages technology to make finding work or talent faster and more efficient than ever before.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CircleCheckBig className="h-5 w-5 text-green-500 mr-2" /> {/* Corrected from CheckCircle */}
                  Verified profiles for trust and safety.
                </li>
                <li className="flex items-center">
                  <CircleCheckBig className="h-5 w-5 text-green-500 mr-2" /> {/* Corrected from CheckCircle */}
                  Advanced search filters to find the perfect match.
                </li>
                <li className="flex items-center">
                  <CircleCheckBig className="h-5 w-5 text-green-500 mr-2" /> {/* Corrected from CheckCircle */}
                  Secure and straightforward subscription options.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
