import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRP-Raja - Poultry Farm Management",
  description: "Digital poultry farm ledger and management system",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen text-black-global`}>
        {/* Background image with translucent overlay */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/poultry_farm.jpg')] bg-cover bg-center opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30" />
        </div>

        {children}
      </body>
    </html>
  );
}
