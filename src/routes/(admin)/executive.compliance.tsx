import { createFileRoute } from "@tanstack/react-router";
import { CompliancePage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/compliance")({
  head: () => ({ meta: [{ title: "Compliance Overview — Executive Dashboard" }] }),
  component: CompliancePage,
});
