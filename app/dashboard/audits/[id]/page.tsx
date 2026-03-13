import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditHeader } from "@/components/audits/audit-header";
import { QuestionsList } from "@/components/audits/questions-list";
import { AuditStats } from "@/components/audits/audit-stats";

interface AuditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditPage({ params }: AuditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: audit } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (!audit) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("audit_questions")
    .select("*")
    .eq("audit_id", id)
    .order("question_number", { ascending: true });

  const { data: kbEntries } = await supabase
    .from("kb_entries")
    .select("id, question, answer, tags");

  return (
    <div className="space-y-6">
      <AuditHeader audit={audit} />
      <AuditStats questions={questions || []} />
      <QuestionsList 
        auditId={id}
        questions={questions || []} 
        kbEntries={kbEntries || []}
      />
    </div>
  );
}
