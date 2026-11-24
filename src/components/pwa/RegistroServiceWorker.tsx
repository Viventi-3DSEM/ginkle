"use client";

import { useEffect } from "react";

export function RegistroServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registrar = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Falha silenciosa em ambientes sem suporte ou bloqueio de SW
        });
    };

    if (document.readyState === "complete") {
      registrar();
      return;
    }

    window.addEventListener("load", registrar, { once: true });
    return () => window.removeEventListener("load", registrar);
  }, []);

  return null;
}
