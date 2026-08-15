"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight, Search, Download, Printer, BookOpen } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { bylawsData } from "@/features/bylaws/data/bylaws";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";

interface BylawsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBylawId?: string;
}

export function BylawsSheet({ open, onOpenChange, initialBylawId }: BylawsSheetProps) {
  const [selectedBylaw, setSelectedBylaw] = React.useState<typeof bylawsData[0] | null>(
    initialBylawId ? bylawsData.find((b) => b.id === initialBylawId) || null : null
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showList, setShowList] = React.useState(!initialBylawId);

  React.useEffect(() => {
    if (initialBylawId && !selectedBylaw) {
      const bylaw = bylawsData.find((b) => b.id === initialBylawId);
      setSelectedBylaw(bylaw || null);
      setShowList(false);
    }
  }, [initialBylawId, selectedBylaw]);

  const filteredBylaws = bylawsData.filter(
    (bylaw) =>
      bylaw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bylaw.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bylaw.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: "revenue", name: "Revenue Bylaws", icon: "💰", color: "text-amber-600" },
    { id: "compliance", name: "Compliance Bylaws", icon: "📋", color: "text-blue-600" },
    { id: "enforcement", name: "Enforcement Bylaws", icon: "🛡️", color: "text-red-600" },
    { id: "general", name: "General Bylaws", icon: "📜", color: "text-green-600" },
  ];

  const handleBylawSelect = (bylaw: typeof bylawsData[0]) => {
    setSelectedBylaw(bylaw);
    setShowList(false);
    setSearchQuery("");
  };

  const handleBackToList = () => {
    setShowList(true);
    setSelectedBylaw(null);
  };

  const handleDownload = () => {
    if (!selectedBylaw) return;
    const blob = new Blob([selectedBylaw.fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedBylaw.shortTitle.replace(/\s+/g, "-")}-bylaw.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!selectedBylaw) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedBylaw.title}</title>
            <style>
              body { font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
              h1 { color: #0f4c3a; border-bottom: 2px solid #c9a84c; padding-bottom: 0.5rem; }
              h2 { color: #0f4c3a; margin-top: 2rem; }
              pre { white-space: pre-wrap; font-family: inherit; }
              .meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
            </style>
          </head>
          <body>
            <h1>${selectedBylaw.title}</h1>
            <div class="meta">Category: ${selectedBylaw.category} | Last Updated: ${selectedBylaw.lastUpdated} | Applicable Wards: ${selectedBylaw.wardApplicability.join(", ")}</div>
            <pre>${selectedBylaw.fullText}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-4xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <span className="text-2xl">📜</span>
                Council Bylaws
              </SheetTitle>
              <SheetDescription>
                Browse and read all Kwali Area Council bylaws
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        {showList && (
          <div className="flex h-[calc(100vh-200px)] flex-col">
            <div className="mb-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search bylaws by title, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {categories.map((cat) => {
                const categoryBylaws = filteredBylaws.filter((b) => b.category === cat.id);
                if (categoryBylaws.length === 0) return null;

                return (
                  <div key={cat.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <span className={cn("text-xl", cat.color)}>{cat.icon}</span>
                      <h3 className="font-semibold text-ink">{cat.name}</h3>
                      <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {categoryBylaws.length}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {categoryBylaws.map((bylaw) => (
                        <button
                          key={bylaw.id}
                          onClick={() => handleBylawSelect(bylaw)}
                          className="group p-4 rounded-xl border border-border bg-card text-left transition hover:border-primary/40 hover:shadow-md hover:bg-primary/5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
                              {bylaw.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-ink">{bylaw.shortTitle}</div>
                              <div className="text-sm text-muted-foreground line-clamp-2">{bylaw.description}</div>
                              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="rounded-full bg-secondary px-2 py-0.5">{bylaw.category}</span>
                                <span>Updated {bylaw.lastUpdated}</span>
                              </div>
                            </div>
                          </div>
                          <BookOpen className="absolute right-4 top-4 h-5 w-5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredBylaws.length === 0 && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No bylaws match your search
                </div>
              )}
            </div>
          </div>
        )}

        {selectedBylaw && !showList && (
          <div className="flex h-[calc(100vh-200px)] flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={handleBackToList} className="h-9 w-9">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 text-center">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {selectedBylaw.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleDownload} className="h-9 w-9" title="Download">
                  <Download className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePrint} className="h-9 w-9" title="Print">
                  <Printer className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleBackToList} className="h-9 w-9">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 prose prose-sm max-w-none">
              <h1 className="text-2xl font-bold text-ink border-b border-border pb-3 mb-4">
                {selectedBylaw.title}
              </h1>
              <div className="mb-6 text-sm text-muted-foreground flex flex-wrap gap-4">
                <span>📅 Last Updated: {selectedBylaw.lastUpdated}</span>
                <span>🏘️ Wards: {selectedBylaw.wardApplicability.join(", ")}</span>
                <span>📂 Category: {selectedBylaw.category}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-body">
                {selectedBylaw.fullText}
              </pre>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function BylawsFullPage({ initialBylawId }: { initialBylawId?: string }) {
  const [open, setOpen] = React.useState(true);

  return (
    <BylawsSheet
      open={open}
      onOpenChange={setOpen}
      initialBylawId={initialBylawId}
    />
  );
}