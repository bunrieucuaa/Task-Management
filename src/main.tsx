import { StrictMode, Suspense, lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/redux/store";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import {
  clearAuthentication,
  finishAuthInitialization,
  hasStoredAuthTokens,
  initializeAuth,
} from "@/redux/authSlice";
import { setupAxiosInterceptors } from "./app/shared/config/axios-interceptor";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

const NotFound = lazy(() => import("@/pages/NotFound"));

setupAxiosInterceptors(() => {
  store.dispatch(clearAuthentication());
});

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => (
    <Suspense fallback={null}>
      <NotFound />
    </Suspense>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const AuthBootstrap = () => {
  const dispatch = useAppDispatch();
  const { initialized, initializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (initialized || initializing) {
      return;
    }

    if (!hasStoredAuthTokens()) {
      dispatch(finishAuthInitialization());
      return;
    }

    void dispatch(initializeAuth());
  }, [dispatch, initialized, initializing]);

  return null;
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthBootstrap />
          <RouterProvider router={router} />
          <Toaster />
        </ThemeProvider>
      </Provider>
    </StrictMode>,
  );
}
