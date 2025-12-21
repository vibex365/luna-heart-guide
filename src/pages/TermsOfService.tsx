import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Terms of Service</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">Last updated: December 2024</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Luna, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Luna is a mental wellness and relationship support application that provides 
            mood tracking, journaling, AI-powered conversations, and couples features. 
            Our service is not a substitute for professional mental health care.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account 
            credentials. You must be at least 18 years old to use the couples features 
            and any adult content. You agree to provide accurate information when 
            creating your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree not to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Use the service for any illegal purpose</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to gain unauthorized access to the service</li>
            <li>Share inappropriate or harmful content</li>
            <li>Impersonate other users or entities</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Subscription and Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            Some features require a paid subscription. Subscriptions automatically renew 
            unless cancelled. Refunds are subject to our refund policy and applicable 
            app store policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            All content and materials in the app, including text, graphics, logos, and 
            software, are owned by Luna or its licensors and are protected by 
            intellectual property laws.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground leading-relaxed">
            The service is provided "as is" without warranties of any kind. We do not 
            guarantee that the service will be uninterrupted, secure, or error-free. 
            Luna is not a replacement for professional medical or mental health advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Luna shall not be liable for any 
            indirect, incidental, special, or consequential damages arising from your 
            use of the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may modify these terms at any time. Continued use of the service after 
            changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these terms, contact us at support@lunaapp.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
