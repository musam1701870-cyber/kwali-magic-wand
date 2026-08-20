import { createFileRoute } from "@tanstack/react-router";
import { RevenueIntelligencePage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/intelligence")({
  head: () => ({ meta: [{ title: "Revenue Intelligence — Executive Dashboard" }] }),
  component: RevenueIntelligencePage,
});
