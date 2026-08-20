import { createFileRoute } from "@tanstack/react-router";
import { TransportPerformancePage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/transport")({
  head: () => ({ meta: [{ title: "Transport Performance — Executive Dashboard" }] }),
  component: TransportPerformancePage,
});
