import { createFileRoute } from "@tanstack/react-router";
import { PaymentSettlementPage } from "@/shared/components/executive/ExecutivePages";

export const Route = createFileRoute("/(admin)/executive/payments")({
  head: () => ({ meta: [{ title: "Payments & Settlement — Executive Dashboard" }] }),
  component: PaymentSettlementPage,
});
