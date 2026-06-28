import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/app/components/BottomNav";
import IOSInstallBanner from "@/app/components/IOSInstallBanner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arena Almeida",
  description: "Bolão da Copa do Mundo 2026 da Família Almeida",
  applicationName: "Arena Almeida",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arena Almeida",
  },
  openGraph: {
    title: "Arena Almeida",
    description: "Bolão da Copa do Mundo 2026 da Família Almeida",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#002776",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#013d16] pb-16">
        {children}
        <BottomNav />
        <IOSInstallBanner />
      </body>
    </html>
  );
}
