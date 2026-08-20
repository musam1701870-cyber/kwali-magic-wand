import { createFileRoute } from "@tanstack/react-router";
import { ExecutiveDashboard } from "@/shared/components/executive/ExecutiveDashboard";

export const Route = createFileRoute("/(admin)/executive")({
  head: () => ({ meta: [{ title: "Executive Dashboard — Kwali Area Council" }] }),
  component: ExecutiveDashboard,
});
