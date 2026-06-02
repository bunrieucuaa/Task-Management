import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : null;

const RootLayout = () => (
  <>
    <Outlet />
    {TanStackRouterDevtools ? (
      <Suspense fallback={null}>
        <TanStackRouterDevtools />
      </Suspense>
    ) : null}
  </>
);

export const Route = createRootRoute({ component: RootLayout });
