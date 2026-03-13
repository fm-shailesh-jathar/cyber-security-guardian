"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KBCategory } from "@/lib/types";

interface KBCategoriesProps {
  categories: KBCategory[];
}

export function KBCategories({ categories }: KBCategoriesProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    setIsLoading(true);
    const supabase = createClient();
    
    await supabase.from("kb_categories").insert({
      name: newCategory.trim(),
    });

    setNewCategory("");
    setIsAdding(false);
    setIsLoading(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Categories</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isAdding && (
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="h-8"
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button
              size="sm"
              className="h-8"
              onClick={handleAddCategory}
              disabled={isLoading || !newCategory.trim()}
            >
              Add
            </Button>
          </div>
        )}
        {categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span>{category.name}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        )}
      </CardContent>
    </Card>
  );
}
