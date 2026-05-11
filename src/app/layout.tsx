import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZimSchool Pro - Zimbabwe School Management System",
  description: "Comprehensive school management system for Zimbabwean schools. Manage students, staff, academics, finance, and more.",
  keywords: ["ZimSchool", "school management", "Zimbabwe", "education", "administration"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors closeButton toastOptions={{
            className: "border-emerald-200 dark:border-emerald-800",
            style: {
              borderLeft: '4px solid #10b981',
            },
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
