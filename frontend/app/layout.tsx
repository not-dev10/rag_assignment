import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document RAG Assistant — Grounded Document Q&A",
  description: "Ask questions grounded strictly in uploaded documents with verified citations, retrieval inspection, and honest fallbacks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-zinc-50/50 font-sans text-zinc-900 antialiased min-h-screen"
      >
        {children}
      </body>
    </html>
  );
}
