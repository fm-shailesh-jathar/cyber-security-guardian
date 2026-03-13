import Link from "next/link";
import { 
  Shield, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  BookOpen,
  ArrowRight,
  Zap,
  Lock,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const features = [
    {
      icon: Upload,
      title: "Easy Import",
      description: "Upload audit questionnaires from CSV or Excel files. Questions are automatically extracted and organized.",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Suggestions",
      description: "Leverage your knowledge base to generate intelligent answer suggestions with confidence scores.",
    },
    {
      icon: CheckCircle2,
      title: "Approval Workflow",
      description: "Built-in review and approval process ensures accuracy and compliance before finalizing responses.",
    },
    {
      icon: BookOpen,
      title: "Knowledge Base",
      description: "Build a searchable repository of approved answers to maintain consistency across audits.",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Analysts, reviewers, and admins work together with appropriate permissions and visibility.",
    },
    {
      icon: FileText,
      title: "Export Ready",
      description: "Export completed audits to CSV for submission or further processing.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold">CyberGuard</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-muted/30 py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" />
                Streamline Your GRC Workflow
              </div>
              <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Automate Cybersecurity Audit Responses
              </h1>
              <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl">
                CyberGuard helps GRC teams respond to security questionnaires faster with AI-powered answer suggestions, a centralized knowledge base, and built-in approval workflows.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/auth/sign-up">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute -top-40 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 right-0 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                A complete platform for managing cybersecurity audit questionnaires from intake to submission.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 bg-muted/30">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Get started in minutes and streamline your audit response process.
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    step: "1",
                    title: "Upload Questionnaire",
                    description: "Import your audit questionnaire from CSV or Excel. Questions are automatically parsed.",
                  },
                  {
                    step: "2",
                    title: "Generate Answers",
                    description: "AI suggests answers based on your knowledge base. Review and edit as needed.",
                  },
                  {
                    step: "3",
                    title: "Review & Export",
                    description: "Approve responses through workflow, then export the completed audit.",
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
              <Lock className="mx-auto mb-6 h-12 w-12 opacity-90" />
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
                Ready to Streamline Your Audits?
              </h2>
              <p className="mb-8 opacity-90">
                Join security teams using CyberGuard to respond to audits faster and more accurately.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">CyberGuard</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Automated Cybersecurity Audit Response System
          </p>
        </div>
      </footer>
    </div>
  );
}
