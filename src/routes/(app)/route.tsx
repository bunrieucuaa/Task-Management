import Layout from "@/layouts/layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
  component: AppShellLayout,
});

function AppShellLayout() {
  return (
    <div className="flex min-h-dvh w-full">
      <Layout>
        <Outlet />
      </Layout>
    </div>
  );
}
