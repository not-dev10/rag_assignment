import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAGSpace — Enterprise Grounded Document Assistant",
  description: "Ask questions grounded strictly in uploaded documents with verified citations, retrieval inspection, and honest fallbacks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        suppressHydrationWarning
        className="font-sans text-on-surface antialiased min-h-screen bg-canvas-bg"
      >
        {children}
      </body>
    </html>
  );
}
