import type { Metadata } from "next";
import { Merriweather, Montserrat } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Casa Turística Valema — alojamiento boutique con rooftop",
    template: "%s · Casa Turística Valema",
  },
  description:
    "Cinco habitaciones independientes, cada una con su nombre y su carácter, y un rooftop donde la tarde se alarga. Consulta disponibilidad y reserva directo, sin intermediarios.",
  applicationName: "Casa Turística Valema",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Casa Turística Valema",
    url: SITE_URL,
    images: [{ url: "/foto3.png", width: 1200, height: 630, alt: "Casa Turística Valema" }],
  },
  twitter: { card: "summary_large_image", images: ["/foto3.png"] },
  icons: { icon: "/valema-logo.jpg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      className={`${merriweather.variable} ${montserrat.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-carbon focus:px-4 focus:py-2 focus:text-[13px] focus:text-marfil"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
