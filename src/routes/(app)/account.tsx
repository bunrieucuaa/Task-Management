import AccountPage from "@/pages/account/AccountPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/account")({
  component: AccountPage,
});
