"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

/**
 * Se muestra cuando no pudimos confirmar si hay sesion por un problema
 * transitorio (wifi caido, timeout, rate limit de Supabase Auth) -- ver
 * getVerifiedUser(). A proposito NO redirige a /login: la sesion podria ser
 * perfectamente valida, el request que la verificaba fue el que fallo.
 * Reintentar (recargar) alcanza en la gran mayoria de los casos.
 */
export function SessionCheckIssueScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>No pudimos verificar tu sesión</CardTitle>
          <CardDescription>
            Puede haber sido un problema momentáneo de conexión. Probá de nuevo en unos segundos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
