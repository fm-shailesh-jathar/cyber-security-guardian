export type UserRole = "analyst" | "reviewer" | "admin";

export type QuestionStatus =
  | "pending"
  | "ai_suggested"
  | "in_review"
  | "approved"
  | "rejected";

export type AuditStatus = "draft" | "in_progress" | "completed" | "archived";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface KBCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface KBEntry {
  id: string;
  category_id: string | null;
  question: string;
  answer: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: KBCategory;
}

export interface Audit {
  id: string;
  name: string;
  description: string | null;
  status: AuditStatus;
  source_file_name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  questions?: AuditQuestion[];
  question_count?: number;
  answered_count?: number;
  approved_count?: number;
}

export interface AuditQuestion {
  id: string;
  audit_id: string;
  question_number: number;
  question_text: string;
  category: string | null;
  suggested_answer: string | null;
  final_answer: string | null;
  status: QuestionStatus;
  confidence_score: number | null;
  kb_reference_ids: string[];
  assigned_to: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
  reviewer?: Profile;
}

export interface ApprovalHistory {
  id: string;
  question_id: string;
  action: "submitted" | "approved" | "rejected" | "edited";
  previous_answer: string | null;
  new_answer: string | null;
  comment: string | null;
  performed_by: string;
  created_at: string;
  performer?: Profile;
}

export interface AuditStats {
  total_questions: number;
  pending: number;
  ai_suggested: number;
  in_review: number;
  approved: number;
  rejected: number;
}

export interface ParsedQuestion {
  question_number: number;
  question_text: string;
  category?: string;
}
