"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const scrollPositions = new Map<string, number>();
let isPopstate = false;

export function ScrollRestoration() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const pathnameRef = useRef(pathname);
  const isInitialMount = useRef(true);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const savePosition = () => {
      scrollPositions.set(pathnameRef.current, window.scrollY);
    };

    const handlePopstate = () => {
      savePosition();
      isPopstate = true;
    };

    window.addEventListener("popstate", handlePopstate);
    document.addEventListener("click", savePosition, { capture: true });

    return () => {
      window.removeEventListener("popstate", handlePopstate);
      document.removeEventListener("click", savePosition, { capture: true });
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathname.current = pathname;
      return;
    }

    if (pathname === prevPathname.current) return;

    prevPathname.current = pathname;

    if (isPopstate) {
      isPopstate = false;
      const saved = scrollPositions.get(pathname);
      if (saved != null) {
        const restore = () => window.scrollTo(0, saved);
        requestAnimationFrame(restore);
        const t1 = setTimeout(restore, 50);
        const t2 = setTimeout(restore, 150);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
