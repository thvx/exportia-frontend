import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../components/ui/sonner";
import { AuthProvider } from "../lib/auth/AuthContext";
import { ProfileSetupDialog } from "../components/ProfileSetupDialog";
import { BottomNav } from "../components/BottomNav";
import { SidebarNav } from "../components/SidebarNav";
import { useAuth } from "../lib/auth/AuthContext";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Página no encontrada
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ExportIA — Inteligencia de exportación para mypes" },
      { name: "description", content: "Toma decisiones de exportación inteligentes sin complicaciones técnicas." },
      { name: "author", content: "ExportIA" },
      { property: "og:title", content: "ExportIA" },
      { property: "og:description", content: "Tu negocio internacional simplificado" },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppLayout() {
  const location = useLocation();
  const { user, isAuthenticated, loading, refreshToken } = useAuth();
  const [setupOpen, setSetupOpen] = useState(false);
  const [dismissedSetup, setDismissedSetup] = useState(false);
  const isAuthRoute = location.pathname === "/auth";
  const needsSetup = isAuthenticated && !!user && user.products.length === 0 && user.destination_countries.length === 0;

  useEffect(() => {
    if (!loading && needsSetup && !dismissedSetup && !isAuthRoute) {
      setSetupOpen(true);
    }
  }, [dismissedSetup, isAuthRoute, loading, needsSetup]);

  function handleSetupOpenChange(open: boolean) {
    setSetupOpen(open);
    if (!open) setDismissedSetup(true);
  }

  return (
    <>
      <div className={isAuthRoute ? "min-h-screen" : "flex min-h-screen"}>
        {!isAuthRoute && <SidebarNav />}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        {!isAuthRoute && <BottomNav />}
      </div>
      <ProfileSetupDialog
        open={setupOpen}
        onOpenChange={handleSetupOpenChange}
        onCompleted={refreshToken}
      />
    </>
  );
}
