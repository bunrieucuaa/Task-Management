import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/redux/store";
import { Provider } from "react-redux";
import { clearAuthentication } from "@/redux/authSlice";
import { setupAxiosInterceptors } from "./app/shared/config/axios-interceptor";

setupAxiosInterceptors(() => {
  store.dispatch(clearAuthentication());
});
// Create a new router instance
const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
        <Toaster />
      </Provider>
    </StrictMode>,
  );
}
