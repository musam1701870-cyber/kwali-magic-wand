import { createFileRoute } from "@tanstack/react-router";
import { EnforcementPage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/enforcement")({
  head: () => ({ meta: [{ title: "Enforcement Overview — Executive Dashboard" }] }),
  component: EnforcementPage,
});
