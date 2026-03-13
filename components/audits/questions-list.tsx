"use client";

import { useState } from "react";
import { Search, Filter, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "./question-card";
import { AuditQuestion, KBEntry } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface QuestionsListProps {
  auditId: string;
  questions: AuditQuestion[];
  kbEntries: Pick<KBEntry, "id" | "question" | "answer" | "tags">[];
}

export function QuestionsList({ auditId, questions, kbEntries }: QuestionsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = 
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generateAIAnswers = async () => {
    setIsGenerating(true);
    const supabase = createClient();
    
    const pendingQuestions = questions.filter((q) => q.status === "pending");
    
    for (const question of pendingQuestions) {
      // Find relevant KB entries using simple keyword matching
      const relevantEntries = kbEntries.filter((entry) => {
        const questionWords = question.question_text.toLowerCase().split(/\s+/);
        const entryText = `${entry.question} ${entry.answer} ${entry.tags.join(" ")}`.toLowerCase();
        return questionWords.some((word) => word.length > 4 && entryText.includes(word));
      });

      let suggestedAnswer = "";
      let confidenceScore = 0;

      if (relevantEntries.length > 0) {
        // Use the best matching KB entry as the suggested answer
        suggestedAnswer = relevantEntries[0].answer;
        confidenceScore = Math.min(0.95, 0.7 + relevantEntries.length * 0.05);
      } else {
        // Generate a placeholder response indicating need for manual input
        suggestedAnswer = `[AI Note: No direct knowledge base match found for this question. Please provide a manual answer or add relevant entries to the knowledge base.]\n\nBased on the question "${question.question_text}", this appears to require information about your organization's specific policies and procedures.`;
        confidenceScore = 0.3;
      }

      await supabase
        .from("audit_questions")
        .update({
          suggested_answer: suggestedAnswer,
          status: "ai_suggested",
          confidence_score: confidenceScore,
          kb_reference_ids: relevantEntries.map((e) => e.id),
        })
        .eq("id", question.id);
    }

    router.refresh();
    setIsGenerating(false);
  };

  const pendingCount = questions.filter((q) => q.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:w-64"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="ai_suggested">AI Suggested</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
            {pendingCount > 0 && (
              <Button onClick={generateAIAnswers} disabled={isGenerating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : `Generate AI Answers (${pendingCount})`}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                kbEntries={kbEntries}
              />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No questions found matching your criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
