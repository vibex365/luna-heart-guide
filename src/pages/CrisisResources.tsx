import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Globe, MessageCircle, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";

interface Resource {
  name: string;
  description: string;
  phone?: string;
  text?: string;
  website?: string;
  available: string;
}

interface ResourceSection {
  title: string;
  icon: React.ReactNode;
  resources: Resource[];
}

const sections: ResourceSection[] = [
  {
    title: "Crisis Hotlines",
    icon: <Phone className="w-5 h-5" />,
    resources: [
      {
        name: "988 Suicide & Crisis Lifeline",
        description: "Free, confidential support for people in distress",
        phone: "988",
        text: "Text 988",
        website: "https://988lifeline.org",
        available: "24/7",
      },
      {
        name: "Crisis Text Line",
        description: "Text-based crisis support",
        text: "Text HOME to 741741",
        website: "https://crisistextline.org",
        available: "24/7",
      },
      {
        name: "National Domestic Violence Hotline",
        description: "Support for domestic violence survivors",
        phone: "1-800-799-7233",
        website: "https://thehotline.org",
        available: "24/7",
      },
    ],
  },
  {
    title: "International Resources",
    icon: <Globe className="w-5 h-5" />,
    resources: [
      {
        name: "International Association for Suicide Prevention",
        description: "Directory of crisis centers worldwide",
        website: "https://www.iasp.info/resources/Crisis_Centres/",
        available: "Varies",
      },
      {
        name: "UK - Samaritans",
        description: "Emotional support for anyone in the UK",
        phone: "116 123",
        website: "https://samaritans.org",
        available: "24/7",
      },
      {
        name: "Canada - Crisis Services Canada",
        description: "National crisis line for Canada",
        phone: "1-833-456-4566",
        text: "Text 45645",
        website: "https://crisisservicescanada.ca",
        available: "24/7",
      },
    ],
  },
  {
    title: "Mental Health Support",
    icon: <Heart className="w-5 h-5" />,
    resources: [
      {
        name: "NAMI Helpline",
        description: "Information and support for mental health",
        phone: "1-800-950-6264",
        website: "https://nami.org/help",
        available: "Mon-Fri",
      },
      {
        name: "7 Cups",
        description: "Free online chat with trained listeners",
        website: "https://7cups.com",
        available: "24/7",
      },
    ],
  },
  {
    title: "Specialized Support",
    icon: <MessageCircle className="w-5 h-5" />,
    resources: [
      {
        name: "Trevor Project",
        description: "Crisis support for LGBTQ+ young people",
        phone: "1-866-488-7386",
        text: "Text START to 678-678",
        website: "https://thetrevorproject.org",
        available: "24/7",
      },
      {
        name: "Veterans Crisis Line",
        description: "Support for veterans and their families",
        phone: "988, then press 1",
        text: "Text 838255",
        website: "https://veteranscrisisline.net",
        available: "24/7",
      },
    ],
  },
];

const CrisisResources = () => {
  const navigate = useNavigate();

  return (
    <MobileOnlyLayout>
      <div className="gradient-hero safe-area-top">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">Crisis Resources</h1>
              <p className="text-xs text-muted-foreground">Help is always available</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 space-y-4">
          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground mb-1">
                      If you are in immediate danger
                    </h2>
                    <p className="text-muted-foreground text-sm mb-3">
                      Please call emergency services or go to your nearest emergency room.
                    </p>
                    <a
                      href="tel:911"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Call 911
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resource Sections */}
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (sectionIndex + 1) * 0.1 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-accent">{section.icon}</span>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {section.resources.map((resource, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-muted/50"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{resource.name}</h3>
                        <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          {resource.available}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {resource.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {resource.phone && (
                          <a
                            href={`tel:${resource.phone.replace(/[^0-9]/g, "")}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground rounded-lg text-xs font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            {resource.phone}
                          </a>
                        )}
                        {resource.text && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium">
                            <MessageCircle className="w-3 h-3" />
                            {resource.text}
                          </span>
                        )}
                        {resource.website && (
                          <a
                            href={resource.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center py-4"
          >
            <p className="text-xs text-muted-foreground">
              💜 Asking for help is a sign of strength.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Luna is not a substitute for professional care.
            </p>
          </motion.div>
        </main>
      </div>
    </MobileOnlyLayout>
  );
};

export default CrisisResources;
