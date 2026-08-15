"use client";

import * as React from "react";
import { ChevronDown, BookOpen, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { bylawsData } from "@/features/bylaws/data/bylaws";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/shared/components/ui/dropdown-menu";

interface BylawsDropdownProps {
  className?: string;
  onSelect?: (bylawId: string) => void;
}

export function BylawsDropdown({ className, onSelect }: BylawsDropdownProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredBylaws = bylawsData.filter(
    (bylaw) =>
      bylaw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bylaw.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bylaw.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: "revenue", name: "Revenue Bylaws", icon: "💰" },
    { id: "compliance", name: "Compliance Bylaws", icon: "📋" },
    { id: "enforcement", name: "Enforcement Bylaws", icon: "🛡️" },
    { id: "general", name: "General Bylaws", icon: "📜" },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition hover:border-primary/40 hover:shadow-md",
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl">
              📜
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Council Bylaws</div>
              <div className="text-xs text-muted-foreground">
                {bylawsData.length} bylaws across {categories.length} categories
              </div>
            </div>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition", isOpen && "rotate-180")} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-full max-w-2xl p-0"
        sideOffset={8}
        align="start"
      >
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bylaws..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {categories.map((cat) => {
            const categoryBylaws = filteredBylaws.filter((b) => b.category === cat.id);
            if (categoryBylaws.length === 0) return null;

            return (
              <DropdownMenuGroup key={cat.id}>
                <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-primary">
                  <span>{cat.icon}</span>
                  {cat.name}
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {categoryBylaws.length}
                  </span>
                </DropdownMenuLabel>
                {categoryBylaws.map((bylaw) => (
                  <DropdownMenuItem
                    key={bylaw.id}
                    className="flex items-start gap-3 px-3 py-3 hover:bg-primary/5"
                    onClick={() => {
                      onSelect?.(bylaw.id);
                      setIsOpen(false);
                    }}
                    inset
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                      {bylaw.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink">{bylaw.shortTitle}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{bylaw.description}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-0.5">{bylaw.category}</span>
                        <span>Updated {bylaw.lastUpdated}</span>
                      </div>
                    </div>
                    <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            );
          })}

          {filteredBylaws.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No bylaws match your search
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Kwali Area Council Bylaws 2024</span>
            <span>Last updated October 2024</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BylawsDropdownCompact({ onSelect }: { onSelect?: (bylawId: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:border-primary/40 hover:bg-primary/5">
          <span className="text-lg">📜</span>
          <span>Bylaws</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" sideOffset={4}>
        <DropdownMenuLabel>Council Bylaws</DropdownMenuLabel>
        {bylawsData.map((bylaw) => (
          <DropdownMenuItem
            key={bylaw.id}
            className="flex items-center gap-2"
            onClick={() => {
              onSelect?.(bylaw.id);
            }}
          >
            <span className="text-lg">{bylaw.icon}</span>
            <span className="text-sm">{bylaw.shortTitle}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}