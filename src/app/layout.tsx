import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { EvmWalletProvider } from "@/components/WalletProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MemeClaw AI — AI Meme & Image Studio",
  description: "Create memes, AI images, and web assets on Solana. Powered by $CLAW.",
  keywords: ["meme generator", "AI memes", "meme studio", "AI image generator", "solana", "claw", "memeclaw"],
  authors: [{ name: "MemeClaw AI" }],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080B12" },
    { media: "(prefers-color-scheme: light)", color: "#080B12" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MemeClaw AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "MemeClaw AI — AI Meme & Image Studio",
    description: "Create memes, AI images, and web assets on Solana. Powered by $CLAW.",
    images: [
      {
        url: "/memeclaw-og.jpg",
        width: 1200,
        height: 630,
        alt: "MemeClaw AI — AI meme and image studio on Solana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MemeClaw AI — AI Meme & Image Studio",
    description: "Create memes, AI images, and web assets on Solana. Powered by $CLAW.",
    images: ["/memeclaw-og.jpg"],
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MemeClaw AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#000000" id="theme-color-meta" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased page-transition`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <EvmWalletProvider>
            <AuthProvider>
              <div className="page-transition">
                {children}
              </div>
              <Toaster richColors position="bottom-center" closeButton />
            </AuthProvider>
          </EvmWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
