import Layout from "@/layouts/layout";
import { createFileRoute } from "@tanstack/react-router";
import AuthGuard from "@/layouts/AuthGuard";

export const Route = createFileRoute("/(app)")({
  component: AppShellLayout,
});

function AppShellLayout() {
  return (
    <div className="flex min-h-dvh w-full">
      <Layout>
        <AuthGuard isPrivate={true} />
      </Layout>
    </div>
  );
}
