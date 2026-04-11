import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "El Timón — Menú Digital | Cocteles y Mariscos desde 1995",
  description: "Menú digital de El Timón, restaurante de cocteles y mariscos en Monterrey. Ve nuestro menú completo con precios, platillos destacados y ordena por WhatsApp.",
  keywords: "el timon, menu, mariscos, cocteles, monterrey, restaurante, seafood, menu digital",
  manifest: "/manifest.json",
  themeColor: "#1E3A5F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "El Timon",
  },
  openGraph: {
    title: "El Timón — Menú Digital",
    description: "Cocteles y Mariscos desde 1995. Ve nuestro menú completo y ordena por WhatsApp.",
    type: "website",
    locale: "es_MX",
    siteName: "El Timón",
    url: "https://eltimon-menu.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "El Timón — Menú Digital",
    description: "Cocteles y Mariscos desde 1995. Ve nuestro menú completo.",
  },
  icons: {
    icon: [
      { url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚓</text></svg>", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
