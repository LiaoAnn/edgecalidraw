import {
  createRootRoute,
  createRouter,
  createRoute,
  Outlet,
} from "@tanstack/react-router";

import ExcalidrawComponent from "./pages/Excalidraw";
import HomePage from "./pages/HomePage";

// Define the root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const excalidrawRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/room/$id",
  component: ExcalidrawComponent,
});

// Define route tree
const routeTree = rootRoute.addChildren([indexRoute, excalidrawRoute]);

// Create router instance
const router = createRouter({ routeTree });

// Export the router and routes for use elsewhere
export { router, rootRoute };
