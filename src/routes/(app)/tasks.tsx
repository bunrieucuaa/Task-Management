import Tasks from "@/pages/Tasks";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/tasks")({
  component: Tasks,
});
