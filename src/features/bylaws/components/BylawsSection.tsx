"use client";

import * as React from "react";
import { ChevronRight, BookOpen, FileText, ExternalLink } from "lucide-react";
import { BylawsDropdown } from "./BylawsDropdown";
import { bylawsData } from "../data/bylaws";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { BylawsSheet } from "./BylawsSheet";

export function BylawsSection() {
  const [selectedBylaw, setSelectedBylaw] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const featuredBylaws = bylawsData.slice(0, 3);
  const remainingBylaws = bylawsData.slice(3);

  const handleBylawClick = (bylawId: string) => {
    setSelectedBylaw(bylawId);
    setSheetOpen(true);
  };

  return (
    <section id="bylaws" className="py-24 bg-surface">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Council Bylaws
            </span>
            <h2 className="mt-4 text-4xl font-bold text-ink">Know your rights & obligations</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Access all Kwali Area Council bylaws — revenue, compliance, enforcement and general regulations.
            </p>
          </div>
          <BylawsDropdown onSelect={handleBylawClick} />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {featuredBylaws.map((bylaw) => (
            <Card
              key={bylaw.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                      {bylaw.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bylaw.shortTitle}</CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {bylaw.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition group-hover:opacity-100"
                    onClick={() => handleBylawClick(bylaw.id)}
                    aria-label={`Read ${bylaw.shortTitle} bylaw`}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{bylaw.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Updated {bylaw.lastUpdated}</span>
                  <span>{bylaw.wardApplicability.length === 10 ? "All Wards" : `${bylaw.wardApplicability.length} Wards`}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleBylawClick(bylaw.id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Read Full Text
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {remainingBylaws.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-ink">Other Council Bylaws</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBylaw(remainingBylaws[0]?.id || null);
                  setSheetOpen(true);
                }}
              >
                View All <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {remainingBylaws.map((bylaw) => (
                <Card
                  key={bylaw.id}
                  className="group overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
                      {bylaw.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-ink">{bylaw.shortTitle}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{bylaw.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px]">{bylaw.category}</Badge>
                        <span>Updated {bylaw.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => handleBylawClick(bylaw.id)}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Read Bylaw
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <BylawsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          initialBylawId={selectedBylaw || undefined}
        />
      </div>
    </section>
  );
}

export function BylawsHero() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Council Bylaws & Regulations
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink md:text-5xl">
          Know Your Rights & Obligations
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Access the complete Kwali Area Council bylaws covering revenue collection, compliance requirements,
          enforcement procedures and general regulations. Search, read, download or print any bylaw.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BylawsDropdown className="w-full sm:w-auto" />
        </div>
      </div>
    </section>
  );
}