"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  BookOpen 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AuditQuestion, KBEntry } from "@/lib/types";

interface ReviewQueueProps {
  questions: (AuditQuestion & { audit: { id: string; name: string } })[];
  kbEntries: Pick<KBEntry, "id" | "question" | "answer" | "tags">[];
}

export function ReviewQueue({ questions, kbEntries }: ReviewQueueProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (question: AuditQuestion) => {
    setIsProcessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("audit_questions")
      .update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", question.id);

    await supabase.from("approval_history").insert({
      question_id: question.id,
      action: "approved",
      previous_answer: question.suggested_answer,
      new_answer: question.final_answer || question.suggested_answer,
      comment: comment || null,
      performed_by: user?.id,
    });

    setComment("");
    setExpandedId(null);
    router.refresh();
    setIsProcessing(false);
  };

  const handleReject = async (question: AuditQuestion) => {
    setIsProcessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("audit_questions")
      .update({
        status: "rejected",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", question.id);

    await supabase.from("approval_history").insert({
      question_id: question.id,
      action: "rejected",
      comment: comment || null,
      performed_by: user?.id,
    });

    setComment("");
    setExpandedId(null);
    router.refresh();
    setIsProcessing(false);
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500/30" />
          <h3 className="mb-2 text-xl font-semibold">All caught up!</h3>
          <p className="text-center text-muted-foreground">
            No answers pending review. Great job!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Pending Review ({questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question) => {
          const isExpanded = expandedId === question.id;
          const relevantKBEntries = kbEntries.filter((entry) =>
            question.kb_reference_ids?.includes(entry.id)
          );

          return (
            <div
              key={question.id}
              className="rounded-lg border bg-card transition-shadow hover:shadow-sm"
            >
              <button
                className="flex w-full items-start justify-between p-4 text-left"
                onClick={() => setExpandedId(isExpanded ? null : question.id)}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-medium text-amber-800">
                    {question.question_number}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium leading-relaxed">
                      {question.question_text}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <Link
                        href={`/dashboard/audits/${question.audit.id}`}
                        className="hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {question.audit.name}
                      </Link>
                      {question.category && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-4 space-y-4">
                  {relevantKBEntries.length > 0 && (
                    <div className="rounded-lg bg-primary/5 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                        <BookOpen className="h-4 w-4" />
                        Referenced Knowledge Base Entries
                      </div>
                      <div className="space-y-2">
                        {relevantKBEntries.map((entry) => (
                          <div key={entry.id} className="text-sm text-muted-foreground">
                            <span className="font-medium">{entry.question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-2 text-sm font-medium">Proposed Answer</div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {question.final_answer || question.suggested_answer}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4" />
                      Review Comment (optional)
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add feedback or reason for your decision..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(question)}
                      disabled={isProcessing}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(question)}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
