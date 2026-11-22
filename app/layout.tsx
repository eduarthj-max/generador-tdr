import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generador de TDR y EETT",
  description: "Redacción de términos de referencia y especificaciones técnicas conforme a la Ley N° 32069",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="barra">
          <div className="contenedor barra-int">
            <Link href="/" className="marca">
              <span className="marca-logo">TDR·EETT</span>
              <span className="marca-sub">Ley N° 32069 · aplicable a todo el Perú</span>
            </Link>
            <nav>
              <Link href="/">Generar</Link>
              <Link href="/referencias">Biblioteca de referencias</Link>
            </nav>
          </div>
        </header>
        <main className="contenedor">{children}</main>
      </body>
    </html>
  );
}
