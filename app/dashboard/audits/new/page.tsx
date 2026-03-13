"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, FileText, X, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ParsedQuestion } from "@/lib/types";

export default function NewAuditPage() {
  const router = useRouter();
  const [auditName, setAuditName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const parseFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    
    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      let questions: ParsedQuestion[] = [];

      if (fileExtension === "csv") {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        questions = extractQuestionsFromData(result.data as Record<string, string>[]);
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        questions = extractQuestionsFromData(data);
      } else {
        throw new Error("Unsupported file format. Please upload CSV or Excel files.");
      }

      if (questions.length === 0) {
        throw new Error("No questions found in the file. Make sure your file has a 'question' column.");
      }

      setParsedQuestions(questions);
      
      if (!auditName) {
        setAuditName(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setParsedQuestions([]);
    } finally {
      setIsParsing(false);
    }
  };

  const extractQuestionsFromData = (data: Record<string, string>[]): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    
    data.forEach((row, index) => {
      const questionKey = Object.keys(row).find(
        (key) => key.toLowerCase().includes("question") && !key.toLowerCase().includes("number")
      );
      const categoryKey = Object.keys(row).find(
        (key) => key.toLowerCase().includes("category") || key.toLowerCase().includes("section")
      );
      const numberKey = Object.keys(row).find(
        (key) => key.toLowerCase().includes("number") || key.toLowerCase().includes("#") || key.toLowerCase() === "id"
      );

      if (questionKey && row[questionKey]?.trim()) {
        questions.push({
          question_number: numberKey && row[numberKey] ? parseInt(row[numberKey]) || index + 1 : index + 1,
          question_text: row[questionKey].trim(),
          category: categoryKey ? row[categoryKey]?.trim() : undefined,
        });
      }
    });

    return questions;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        parseFile(selectedFile);
      }
    },
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const removeFile = () => {
    setFile(null);
    setParsedQuestions([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditName.trim()) {
      setError("Please enter an audit name");
      return;
    }
    if (parsedQuestions.length === 0) {
      setError("Please upload a file with questions");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Create the audit
      const { data: audit, error: auditError } = await supabase
        .from("audits")
        .insert({
          name: auditName.trim(),
          description: description.trim() || null,
          source_file_name: file?.name || null,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (auditError) throw auditError;

      // Insert questions
      const questionsToInsert = parsedQuestions.map((q) => ({
        audit_id: audit.id,
        question_number: q.question_number,
        question_text: q.question_text,
        category: q.category || null,
        status: "pending",
      }));

      const { error: questionsError } = await supabase
        .from("audit_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      router.push(`/dashboard/audits/${audit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create audit");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Audit</h1>
        <p className="text-muted-foreground">
          Upload a questionnaire file to extract questions automatically
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Audit Details</CardTitle>
            <CardDescription>
              Enter the basic information for this audit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Audit Name *
              </label>
              <Input
                id="name"
                value={auditName}
                onChange={(e) => setAuditName(e.target.value)}
                placeholder="e.g., SOC 2 Type II 2024"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of this audit..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Questionnaire</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing audit questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                {...getRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium">
                  {isDragActive ? "Drop your file here" : "Drag & drop your file"}
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  or click to browse
                </p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    CSV
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Excel
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {isParsing ? "Parsing..." : `${parsedQuestions.length} questions found`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {parsedQuestions.length > 0 && (
                  <div className="max-h-64 overflow-y-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">#</th>
                          <th className="px-4 py-2 text-left font-medium">Question</th>
                          <th className="px-4 py-2 text-left font-medium">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedQuestions.slice(0, 10).map((q, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-2 text-muted-foreground">
                              {q.question_number}
                            </td>
                            <td className="px-4 py-2">{q.question_text}</td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {q.category || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedQuestions.length > 10 && (
                      <div className="border-t bg-muted/30 px-4 py-2 text-center text-sm text-muted-foreground">
                        And {parsedQuestions.length - 10} more questions...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !auditName.trim() || parsedQuestions.length === 0}
            isLoading={isLoading}
          >
            Create Audit
          </Button>
        </div>
      </form>
    </div>
  );
}
