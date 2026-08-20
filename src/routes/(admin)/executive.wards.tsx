import { createFileRoute } from "@tanstack/react-router";
import { WardPerformancePage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/wards")({
  head: () => ({ meta: [{ title: "Ward Performance — Executive Dashboard" }] }),
  component: WardPerformancePage,
});
