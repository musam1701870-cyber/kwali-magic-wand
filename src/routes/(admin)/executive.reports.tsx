import { createFileRoute } from "@tanstack/react-router";
import { ExecutiveReportsPage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/reports")({
  head: () => ({ meta: [{ title: "Executive Reports — Kwali Area Council" }] }),
  component: ExecutiveReportsPage,
});
