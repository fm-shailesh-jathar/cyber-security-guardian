"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, MoreHorizontal, Trash2, Play, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Audit } from "@/lib/types";

interface AuditHeaderProps {
  audit: Audit;
}

export function AuditHeader({ audit }: AuditHeaderProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const statusColors = {
    draft: "secondary",
    in_progress: "warning",
    completed: "success",
    archived: "outline",
  } as const;

  const updateStatus = async (newStatus: Audit["status"]) => {
    setIsUpdating(true);
    const supabase = createClient();
    
    await supabase
      .from("audits")
      .update({ status: newStatus })
      .eq("id", audit.id);
    
    router.refresh();
    setIsUpdating(false);
  };

  const handleExport = async () => {
    const supabase = createClient();
    
    const { data: questions } = await supabase
      .from("audit_questions")
      .select("*")
      .eq("audit_id", audit.id)
      .order("question_number", { ascending: true });

    if (!questions) return;

    const csvContent = [
      ["Question #", "Category", "Question", "Status", "Final Answer", "Confidence Score"],
      ...questions.map((q) => [
        q.question_number,
        q.category || "",
        q.question_text,
        q.status,
        q.final_answer || q.suggested_answer || "",
        q.confidence_score || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${audit.name.replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/audits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{audit.name}</h1>
            <Badge variant={statusColors[audit.status]}>
              {audit.status.replace("_", " ")}
            </Badge>
          </div>
          {audit.description && (
            <p className="mt-1 text-muted-foreground">{audit.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {audit.status === "draft" && (
          <Button
            variant="outline"
            onClick={() => updateStatus("in_progress")}
            disabled={isUpdating}
          >
            <Play className="mr-2 h-4 w-4" />
            Start Audit
          </Button>
        )}
        {audit.status === "in_progress" && (
          <Button
            variant="outline"
            onClick={() => updateStatus("completed")}
            disabled={isUpdating}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Complete
          </Button>
        )}
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
