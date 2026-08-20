import { createFileRoute } from "@tanstack/react-router";
import { ExecutiveNoticesPage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/notices")({
  head: () => ({ meta: [{ title: "Notices & Public Orders — Executive Dashboard" }] }),
  component: ExecutiveNoticesPage,
});
