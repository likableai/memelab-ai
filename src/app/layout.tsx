import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { EvmWalletProvider } from "@/components/WalletProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeToggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MemeLab AI — AI Meme Generator & Studio",
  description: "Create memes with AI on Solana. AI image generation, curated templates, voice companion. Powered by $LIKA.",
  keywords: ["meme generator", "AI memes", "meme maker", "meme templates", "AI image generator", "meme studio", "solana", "lika"],
  authors: [{ name: "MemeLab AI" }],
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
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MemeLab AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "MemeLab AI — AI Meme Generator & Studio",
    description: "Create memes with AI on Solana. AI image generation, curated templates, voice companion. Powered by $LIKA.",
    images: [
      {
        url: "/memelab-og.jpg",
        width: 1200,
        height: 630,
        alt: "MemeLab AI meme generator studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MemeLab AI — AI Meme Generator & Studio",
    description: "Create memes with AI on Solana. AI image generation, curated templates, voice companion. Powered by $LIKA.",
    images: ["/memelab-og.jpg"],
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
        <meta name="apple-mobile-web-app-title" content="MemeLab AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#000000" id="theme-color-meta" />
      </head>
      <body
        className={`${inter.variable} antialiased page-transition`}
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
