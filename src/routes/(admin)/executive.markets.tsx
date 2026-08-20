import { createFileRoute } from "@tanstack/react-router";
import { MarketPerformancePage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/markets")({
  head: () => ({ meta: [{ title: "Market Performance — Executive Dashboard" }] }),
  component: MarketPerformancePage,
});
