"use client";

import { Clock, Sparkles, Eye, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AuditQuestion } from "@/lib/types";

interface AuditStatsProps {
  questions: AuditQuestion[];
}

export function AuditStats({ questions }: AuditStatsProps) {
  const stats = {
    total: questions.length,
    pending: questions.filter((q) => q.status === "pending").length,
    ai_suggested: questions.filter((q) => q.status === "ai_suggested").length,
    in_review: questions.filter((q) => q.status === "in_review").length,
    approved: questions.filter((q) => q.status === "approved").length,
    rejected: questions.filter((q) => q.status === "rejected").length,
  };

  const statItems = [
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "AI Suggested",
      value: stats.ai_suggested,
      icon: Sparkles,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "In Review",
      value: stats.in_review,
      icon: Eye,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  const completionRate = stats.total > 0 
    ? Math.round((stats.approved / stats.total) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Card className="md:col-span-1">
        <CardContent className="flex flex-col items-center justify-center p-4">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Questions</p>
        </CardContent>
      </Card>
      {statItems.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
