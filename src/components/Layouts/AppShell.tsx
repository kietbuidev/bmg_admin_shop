"use client";

import AuthGuard from "@/components/Auth/AuthGuard";
import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import NextTopLoader from "nextjs-toploader";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const AUTH_ROUTE_PREFIX = "/auth";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith(AUTH_ROUTE_PREFIX);

  if (isAuthRoute) {
    return (
      <>
        <NextTopLoader color="#5750F1" showSpinner={false} />
        <main className="flex min-h-screen items-center justify-center bg-gray-2 p-4 dark:bg-[#020d1a]">
          <div className="mx-auto w-full max-w-screen-md">{children}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <NextTopLoader color="#5750F1" showSpinner={false} />
      <AuthGuard>
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
            <Header />

            <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    </>
  );
}
