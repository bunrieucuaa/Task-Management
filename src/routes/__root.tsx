import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Layout from "@/layouts/layout";

const RootLayout = () => (
  <>
    <div className="flex min-h-dvh w-full">
      <Layout>
        <Outlet />
      </Layout>
    </div>
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
