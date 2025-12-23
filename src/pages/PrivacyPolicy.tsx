import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">Last updated: December 2024</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect information you provide directly, including your email address, 
            display name, mood entries, journal entries, and relationship data shared 
            between you and your partner. We also collect usage data to improve our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your information is used to provide and improve our services, including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Providing personalized mental wellness support</li>
            <li>Enabling couples features and partner connections</li>
            <li>Sending notifications and reminders you've opted into</li>
            <li>Analyzing usage patterns to improve the app</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your personal 
            information. Your data is encrypted in transit and at rest. We use secure 
            authentication and access controls to prevent unauthorized access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Partner Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you link with a partner, certain information is shared with them as 
            part of the couples features. This includes shared mood entries, game 
            results, and messages. You can control visibility settings for your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use third-party services for authentication, database hosting, and 
            analytics. These services have their own privacy policies and may collect 
            information as permitted by their policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your data for as long as your account is active. You can request 
            deletion of your data at any time by contacting us or deleting your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal information. 
            You can export your data or request its deletion by contacting our support team.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at 
            support@talkswithluna.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
