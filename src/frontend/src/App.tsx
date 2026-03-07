import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import VideosPage from "./pages/VideosPage";
import WalletPage from "./pages/WalletPage";

// ─── Root Route ───────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground font-body",
            title: "font-ui font-semibold",
            description: "font-body text-muted-foreground",
          },
        }}
      />
    </>
  ),
});

// ─── Landing / Auth ───────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// ─── Register ─────────────────────────────────────────────────────────────────
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  validateSearch: (search: Record<string, unknown>): { step?: string } => ({
    step: (search.step as string | undefined) ?? undefined,
  }),
  component: RegisterPage,
});

// ─── Layout Route (authenticated pages) ──────────────────────────────────────
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

// ─── Videos ───────────────────────────────────────────────────────────────────
const videosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/videos",
  component: VideosPage,
});

const videoPlayerRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/videos/$id",
  component: VideoPlayerPage,
});

// ─── Wallet ───────────────────────────────────────────────────────────────────
const walletRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/wallet",
  component: WalletPage,
});

// ─── Admin ────────────────────────────────────────────────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin",
  component: AdminPage,
});

// ─── Route Tree ───────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  registerRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    videosRoute,
    videoPlayerRoute,
    walletRoute,
    adminRoute,
  ]),
]);

// ─── Router ───────────────────────────────────────────────────────────────────
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return <RouterProvider router={router} />;
}
