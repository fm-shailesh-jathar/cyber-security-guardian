import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Plus, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AuditsPage() {
  const supabase = await createClient();
  
  const { data: audits } = await supabase
    .from("audits")
    .select(`
      *,
      audit_questions (
        id,
        status
      )
    `)
    .order("created_at", { ascending: false });

  const statusColors = {
    draft: "secondary",
    in_progress: "warning",
    completed: "success",
    archived: "outline",
  } as const;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audits</h1>
          <p className="text-muted-foreground">
            Manage your security audit questionnaires
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/audits/new">
            <Plus className="mr-2 h-4 w-4" />
            New Audit
          </Link>
        </Button>
      </div>

      {audits && audits.length > 0 ? (
        <div className="grid gap-4">
          {audits.map((audit) => {
            const questions = audit.audit_questions || [];
            const totalQuestions = questions.length;
            const approvedCount = questions.filter(
              (q: { status: string }) => q.status === "approved"
            ).length;
            const progress = totalQuestions > 0 
              ? Math.round((approvedCount / totalQuestions) * 100) 
              : 0;

            return (
              <Link
                key={audit.id}
                href={`/dashboard/audits/${audit.id}`}
                className="group block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary">
                          {audit.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(audit.created_at).toLocaleDateString()}
                          </span>
                          {audit.source_file_name && (
                            <span className="truncate max-w-[200px]">
                              {audit.source_file_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {approvedCount} / {totalQuestions} questions
                        </p>
                        <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant={statusColors[audit.status as keyof typeof statusColors]}>
                        {audit.status.replace("_", " ")}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="mb-2 text-xl font-semibold">No audits yet</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Upload a questionnaire or create a new audit to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/audits/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Audit
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
