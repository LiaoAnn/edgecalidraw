import {
  createRootRoute,
  createRouter,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import ExcalidrawComponent from "@/pages/Excalidraw";
import HomePage from "@/pages/HomePage";
import PasswordScreen from "@/components/PasswordScreen";

// 檢查認證狀態的函數
const checkAuth = async (): Promise<boolean> => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    return false;
  }

  try {
    const response = await fetch("/api/auth/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    if (!data.valid) {
      localStorage.removeItem("auth_token");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Token validation error:", error);
    localStorage.removeItem("auth_token");
    return false;
  }
};

// Define the root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// 登入頁面路由
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: PasswordScreen,
});

// 首頁路由 - 需要認證
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
  beforeLoad: async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

// 房間路由 - 不需要認證
const excalidrawRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/room/$id",
  component: ExcalidrawComponent,
});

// Define route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  excalidrawRoute,
]);

// Create router instance
const router = createRouter({ routeTree });

// Export the router and routes for use elsewhere
export { router, rootRoute };
