'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isHomeIntro = pathname === "/";
  const isNewLanding = pathname?.startsWith("/landing");
  const isLegalPage = pathname?.startsWith("/terms") || pathname?.startsWith("/privacy");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <html lang="ar" suppressHydrationWarning>
      <head>
        <title>ناس مصر</title>
        <meta name="google-site-verification" content="b_EmGmnbOaKSLjHHkflMpFhbZHf87bvEO-re-U2dn00" />
        <link rel="icon" href="/nas-masr.png" type="image/png" sizes="42x42" />
        <link rel="icon" href="/nas-masr.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/nas-masr.png" sizes="180x180" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        {(isHomeIntro || isNewLanding || isLegalPage) ? (
          <main>{children}</main>
        ) : (
          <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
            <Header onToggleSidebar={toggleSidebar} />
            <main className="content">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
