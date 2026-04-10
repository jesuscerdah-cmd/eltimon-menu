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
  title: "El Timon - Menu Digital | Cocteles y Mariscos desde 1995",
  description: "Menu digital de El Timon, restaurante de cocteles y mariscos en Monterrey. Platillos unicos, deliciosos y nutritivos desde 1995.",
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
