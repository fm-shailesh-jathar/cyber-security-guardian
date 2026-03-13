import { createClient } from "@/lib/supabase/server";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BookOpen,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get audit stats
  const { data: audits } = await supabase
    .from("audits")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: totalAudits } = await supabase
    .from("audits")
    .select("*", { count: "exact", head: true });

  const { count: totalQuestions } = await supabase
    .from("audit_questions")
    .select("*", { count: "exact", head: true });

  const { count: pendingReview } = await supabase
    .from("audit_questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_review");

  const { count: approvedAnswers } = await supabase
    .from("audit_questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: kbEntries } = await supabase
    .from("kb_entries")
    .select("*", { count: "exact", head: true });

  const stats = [
    {
      label: "Total Audits",
      value: totalAudits || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Questions",
      value: totalQuestions || 0,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Pending Review",
      value: pendingReview || 0,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Approved",
      value: approvedAnswers || 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  const statusColors = {
    draft: "secondary",
    in_progress: "warning",
    completed: "success",
    archived: "outline",
  } as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your audit responses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Audits</CardTitle>
              <CardDescription>Your latest audit questionnaires</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/audits">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {audits && audits.length > 0 ? (
              <div className="space-y-4">
                {audits.map((audit) => (
                  <Link
                    key={audit.id}
                    href={`/dashboard/audits/${audit.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{audit.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusColors[audit.status as keyof typeof statusColors]}>
                      {audit.status.replace("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No audits yet</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/audits/new">Create Your First Audit</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Your answer repository</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/knowledge-base">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-lg border p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{kbEntries || 0}</p>
                <p className="text-muted-foreground">Knowledge Base Entries</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Add more entries to improve AI answer suggestions and maintain consistency
              across your audit responses.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
