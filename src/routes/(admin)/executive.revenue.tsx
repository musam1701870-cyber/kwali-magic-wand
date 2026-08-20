import { createFileRoute } from "@tanstack/react-router";
import { RevenuePerformancePage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/revenue")({
  head: () => ({ meta: [{ title: "Revenue Performance — Executive Dashboard" }] }),
  component: RevenuePerformancePage,
});
