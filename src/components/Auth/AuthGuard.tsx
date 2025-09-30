"use client";

import {
  AUTH_EVENT,
  AUTH_STORAGE_KEY,
  getStoredAuth,
} from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type Props = {
  children: ReactNode;
};

const AUTH_ROUTE_PREFIX = "/auth";

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const evaluateAccess = () => {
      const stored = getStoredAuth();
      const hasToken = Boolean(stored?.accessToken);
      const isAuthRoute = pathname.startsWith(AUTH_ROUTE_PREFIX);

      if (!hasToken && !isAuthRoute) {
        setCanRender(false);
        router.replace("/auth/sign-in");
        return;
      }

      if (hasToken && isAuthRoute) {
        setCanRender(false);
        router.replace("/");
        return;
      }

      if (!cancelled) {
        setCanRender(true);
      }
    };

    evaluateAccess();

    const handleAuthEvent = () => evaluateAccess();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        evaluateAccess();
      }
    };

    window.addEventListener(AUTH_EVENT, handleAuthEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EVENT, handleAuthEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [pathname, router]);

  if (!canRender) {
    return null;
  }

  return children;
}
