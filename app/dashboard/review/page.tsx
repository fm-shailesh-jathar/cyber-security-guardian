import { createClient } from "@/lib/supabase/server";
import { ReviewQueue } from "@/components/review/review-queue";

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("audit_questions")
    .select(`
      *,
      audit:audits(id, name)
    `)
    .eq("status", "in_review")
    .order("updated_at", { ascending: false });

  const { data: kbEntries } = await supabase
    .from("kb_entries")
    .select("id, question, answer, tags");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground">
          Approve or reject answers submitted for review
        </p>
      </div>
      <ReviewQueue 
        questions={questions || []} 
        kbEntries={kbEntries || []}
      />
    </div>
  );
}
