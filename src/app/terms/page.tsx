
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Terms of Service</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Welcome to LabourLink! These Terms of Service (&quot;Terms&quot;) govern your use of our website,
            mobile applications, and services (collectively, the &quot;Service&quot;). Please read these Terms
            carefully before using the Service.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy.
            If you do not agree to these Terms, do not use the Service.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">2. Service Description</h2>
          <p>
            LabourLink provides an online platform to connect customers seeking construction-related
            services with skilled labour professionals. We are not a party to any agreements entered into
            between customers and labours.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">3. User Accounts</h2>
          <p>
            You may need to register for an account to access certain features of the Service. You are
            responsible for maintaining the confidentiality of your account information and for all
            activities that occur under your account. You agree to notify us immediately of any
            unauthorized use of your account.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">4. User Conduct</h2>
          <p>
            You agree not to use the Service for any unlawful purpose or in any way that could harm,
            disable, overburden, or impair the Service. You agree to provide accurate and truthful
            information.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground pt-4">5. Job Postings and Applications</h2>
          <p>
            Customers are responsible for the accuracy and legality of their job postings. Labours are
            responsible for the accuracy of their profiles and applications. LabourLink does not guarantee
            job placement or the quality of services provided.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">6. Payments and Subscriptions</h2>
          <p>
            Certain features of the Service may require payment or subscription. All payment terms will be
            disclosed to you at the time of purchase. We use third-party payment processors and do not
            store your payment card details.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">7. Intellectual Property</h2>
          <p>
            All content and materials available on the Service, including but not limited to text,
            graphics, website name, code, images, and logos are the intellectual property of LabourLink
            and are protected by applicable copyright and trademark law.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">8. Disclaimers and Limitation of Liability</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind.
            LabourLink shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits or revenues.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground pt-4">9. Termination</h2>
          <p>
            We may terminate or suspend your access to the Service at any time, without prior notice or
            liability, for any reason, including if you breach these Terms.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of any changes by
            posting the new Terms on this page. Your continued use of the Service after any such changes
            constitutes your acceptance of the new Terms.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without
            regard to its conflict of law provisions.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <Link href="/contact" className="text-primary hover:underline">support@labourlink.com</Link>.
          </p>

          <div className="text-center pt-6 border-t mt-8">
            <Button asChild size="lg" variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
