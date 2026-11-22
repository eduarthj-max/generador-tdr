import { NextRequest, NextResponse } from "next/server";

/**
 * Protección opcional con contraseña (HTTP Basic). Se activa si APP_PASSWORD
 * está definida. Evita que terceros usen tu API key si publicas la app.
 */
export default function proxy(req: NextRequest) {
  const clave = process.env.APP_PASSWORD;
  if (!clave) return NextResponse.next();
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    const [, pass] = atob(auth.slice(6)).split(":");
    if (pass === clave) return NextResponse.next();
  }
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Generador TDR/EETT", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/salud).*)"] };
