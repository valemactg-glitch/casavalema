import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Comprobación optimista: si no hay cookie de sesión admin, redirige al login.
 * La validación real de la sesión y el permiso se hace en el servidor
 * (`lib/auth/session.ts#requireUser`).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/admin/recuperar" || pathname.startsWith("/admin/restablecer")) {
    return NextResponse.next();
  }

  if (!request.cookies.get("valema_admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("volver", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
