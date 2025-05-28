
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            LabourLink (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your information when you use our
            website, mobile applications, and services (collectively, the &quot;Service&quot;).
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">1. Information We Collect</h2>
          <p>
            We may collect personal information that you provide to us directly, such as when you create an
            account, post a job, apply for a job, or communicate with us. This information may include:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Name, email address, phone number, and physical address.</li>
            <li>Profile information (e.g., skills, experience, availability for labours; company details for customers).</li>
            <li>Job posting details and application information.</li>
            <li>Payment information (processed by third-party payment processors).</li>
            <li>Communications with us.</li>
          </ul>
          <p className="pt-2">
            We may also collect certain information automatically when you use the Service, such as your IP
            address, browser type, operating system, device information, and usage data.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">2. How We Use Your Information</h2>
          <p>We may use the information we collect for various purposes, including to:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Provide, operate, and maintain our Service.</li>
            <li>Improve, personalize, and expand our Service.</li>
            <li>Understand and analyze how you use our Service.</li>
            <li>Develop new products, services, features, and functionality.</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes.</li>
            <li>Process your transactions and manage your subscriptions.</li>
            <li>Find and prevent fraud.</li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground pt-4">3. How We Share Your Information</h2>
          <p>We may share your information in the following situations:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>With other users of the Service as necessary to facilitate connections (e.g., sharing labour profiles with customers, job details with labours).</li>
            <li>With third-party service providers that perform services for us or on our behalf, such as payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
            <li>For legal purposes, such as to comply with a subpoena or other legal process, or to protect our rights, property, or safety, or the rights, property, or safety of others.</li>
            <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            <li>With your consent or at your direction.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground pt-4">4. Data Security</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal
            information. While we have taken reasonable steps to secure the personal information you provide
            to us, please be aware that despite our efforts, no security measures are perfect or
            impenetrable, and no method of data transmission can be guaranteed against any interception or
            other type of misuse.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground pt-4">5. Your Data Protection Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information,
            such as the right to access, correct, update, or delete your information. You may also have
            the right to object to or restrict certain processing. To exercise these rights, please contact us.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">6. Cookies and Tracking Technologies</h2>
          <p>
            We may use cookies and similar tracking technologies to track the activity on our Service and
            store certain information. You can instruct your browser to refuse all cookies or to indicate
            when a cookie is being sent. However, if you do not accept cookies, you may not be able to use
            some portions of our Service.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground pt-4">7. Children&apos;s Privacy</h2>
          <p>
            Our Service is not intended for use by children under the age of 18. We do not knowingly
            collect personal information from children under 18. If we become aware that we have collected
            personal information from a child under 18, we will take steps to delete such information.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">8. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page. You are advised to review this Privacy Policy
            periodically for any changes.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-4">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <Link href="/contact" className="text-primary hover:underline">support@labourlink.com</Link>.
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
