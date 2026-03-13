import { createClient } from "@/lib/supabase/server";
import { KBHeader } from "@/components/knowledge-base/kb-header";
import { KBList } from "@/components/knowledge-base/kb-list";
import { KBCategories } from "@/components/knowledge-base/kb-categories";

export default async function KnowledgeBasePage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("kb_entries")
    .select(`
      *,
      category:kb_categories(*)
    `)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("kb_categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-8">
      <KBHeader />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <KBCategories categories={categories || []} />
        </div>
        <div className="lg:col-span-3">
          <KBList entries={entries || []} categories={categories || []} />
        </div>
      </div>
    </div>
  );
}
