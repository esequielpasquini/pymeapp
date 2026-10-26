"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { takeFlash } from "@/lib/flash";

/**
 * Muestra el mensaje dejado con setFlash() al llegar a la pantalla
 * siguiente. Se monta una vez en el layout y revisa en cada cambio de ruta.
 */
export function FlashToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const flash = takeFlash();
    if (flash) setMessage(flash);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-lg bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
    >
      {message}
    </div>
  );
}
