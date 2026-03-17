'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CHUNK_RELOAD_KEY = "__chunk_reload_attempt_ts";
const CHUNK_RELOAD_WINDOW_MS = 5 * 60 * 1000;

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

  useEffect(() => {
    const isChunkLoadError = (value: unknown) => {
      const msg = String(
        (value as Error)?.message ||
          (value as { reason?: Error })?.reason?.message ||
          value ||
          ""
      ).toLowerCase();
      return (
        msg.includes("chunkloaderror") ||
        msg.includes("failed to load chunk") ||
        msg.includes("loading chunk") ||
        msg.includes("dynamically imported module")
      );
    };

    const tryReloadOnce = () => {
      const now = Date.now();
      const previous = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || "0");
      const retriedRecently =
        Number.isFinite(previous) && now - previous < CHUNK_RELOAD_WINDOW_MS;

      if (retriedRecently) return;

      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      const url = new URL(window.location.href);
      url.searchParams.set("__r", String(now));
      window.location.replace(url.toString());
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        tryReloadOnce();
      }
    };

    const onWindowError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error || event.message)) {
        event.preventDefault();
        tryReloadOnce();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  const isHomeIntro = pathname === "/";
  const isNewLanding = pathname?.startsWith("/landing");
  const isLegalPage = pathname?.startsWith("/terms") || pathname?.startsWith("/privacy");
  const isAuthPage = pathname?.startsWith("/auth");

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
        {(isHomeIntro || isNewLanding || isLegalPage || isAuthPage) ? (
          <main>{children}</main>
        ) : (
          <AuthGuard>
            <div className="dashboard-layout">
              <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
              <Header onToggleSidebar={toggleSidebar} />
              <main className="content">{children}</main>
            </div>
          </AuthGuard>
        )}
      </body>
    </html>
  );
}
