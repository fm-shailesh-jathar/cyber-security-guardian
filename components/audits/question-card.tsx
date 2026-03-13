"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Edit2, 
  Send, 
  CheckCircle, 
  XCircle,
  BookOpen
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AuditQuestion, KBEntry } from "@/lib/types";

interface QuestionCardProps {
  question: AuditQuestion;
  kbEntries: Pick<KBEntry, "id" | "question" | "answer" | "tags">[];
}

export function QuestionCard({ question, kbEntries }: QuestionCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(
    question.final_answer || question.suggested_answer || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const statusConfig = {
    pending: { label: "Pending", variant: "secondary" as const },
    ai_suggested: { label: "AI Suggested", variant: "info" as const },
    in_review: { label: "In Review", variant: "warning" as const },
    approved: { label: "Approved", variant: "success" as const },
    rejected: { label: "Rejected", variant: "destructive" as const },
  };

  const { label, variant } = statusConfig[question.status];

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();
    
    await supabase
      .from("audit_questions")
      .update({
        final_answer: editedAnswer,
        status: "in_review",
      })
      .eq("id", question.id);

    router.refresh();
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleApprove = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from("audit_questions")
      .update({
        final_answer: editedAnswer || question.suggested_answer,
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", question.id);

    // Log approval in history
    await supabase.from("approval_history").insert({
      question_id: question.id,
      action: "approved",
      previous_answer: question.final_answer,
      new_answer: editedAnswer || question.suggested_answer,
      performed_by: user?.id,
    });

    router.refresh();
    setIsSaving(false);
  };

  const handleReject = async () => {
    setIsSaving(true);
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

    // Log rejection in history
    await supabase.from("approval_history").insert({
      question_id: question.id,
      action: "rejected",
      performed_by: user?.id,
    });

    router.refresh();
    setIsSaving(false);
  };

  const submitForReview = async () => {
    setIsSaving(true);
    const supabase = createClient();
    
    await supabase
      .from("audit_questions")
      .update({
        final_answer: editedAnswer || question.suggested_answer,
        status: "in_review",
      })
      .eq("id", question.id);

    router.refresh();
    setIsSaving(false);
  };

  const relevantKBEntries = kbEntries.filter((entry) =>
    question.kb_reference_ids?.includes(entry.id)
  );

  return (
    <div className="rounded-lg border bg-card transition-shadow hover:shadow-sm">
      <button
        className="flex w-full items-start justify-between p-4 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {question.question_number}
          </span>
          <div className="space-y-1">
            <p className="font-medium leading-relaxed">{question.question_text}</p>
            <div className="flex items-center gap-2">
              {question.category && (
                <Badge variant="outline" className="text-xs">
                  {question.category}
                </Badge>
              )}
              <Badge variant={variant}>{label}</Badge>
              {question.confidence_score !== null && question.status === "ai_suggested" && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  {Math.round(question.confidence_score * 100)}% confidence
                </span>
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
        <div className="border-t px-4 pb-4 pt-4">
          {relevantKBEntries.length > 0 && (
            <div className="mb-4 rounded-lg bg-primary/5 p-3">
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

          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={editedAnswer}
                onChange={(e) => setEditedAnswer(e.target.value)}
                rows={6}
                placeholder="Enter your answer..."
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedAnswer(question.final_answer || question.suggested_answer || "");
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  Save Draft
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(question.final_answer || question.suggested_answer) && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    {question.status === "ai_suggested" && (
                      <>
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Suggested Answer
                      </>
                    )}
                    {question.status !== "ai_suggested" && question.status !== "pending" && (
                      <>Answer</>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {question.final_answer || question.suggested_answer}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
                {(question.status === "ai_suggested" || question.status === "pending") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={submitForReview}
                    disabled={isSaving || (!question.suggested_answer && !editedAnswer)}
                  >
                    <Send className="mr-2 h-3.5 w-3.5" />
                    Submit for Review
                  </Button>
                )}
                {question.status === "in_review" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReject}
                      disabled={isSaving}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <XCircle className="mr-2 h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
