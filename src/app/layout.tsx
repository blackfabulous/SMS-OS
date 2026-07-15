import type { Metadata, Viewport } from "next";
// Self-hosted Geist (via the `geist` package) — no build-time Google Fonts fetch,
// which is faster, privacy-friendly and avoids flaky network failures at build.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/components/query-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "ZimSchool Pro - Zimbabwe School Management System",
  description: "Comprehensive school management system for Zimbabwean schools. Manage students, staff, academics, finance, and more.",
  keywords: ["ZimSchool", "school management", "Zimbabwe", "education", "administration"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZimSchool Pro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ZimSchool Pro" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster position="bottom-right" richColors closeButton toastOptions={{
            className: "border-emerald-200 dark:border-emerald-800",
            style: {
              borderLeft: '4px solid #10b981',
            },
          }} />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
