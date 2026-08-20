import { createFileRoute } from "@tanstack/react-router";
import { ExecutiveGisPage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/gis")({
  head: () => ({ meta: [{ title: "Council GIS — Executive Dashboard" }] }),
  component: ExecutiveGisPage,
});
