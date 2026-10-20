import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAGSpace — Enterprise Vector Engine & Grounded Knowledge Base",
  description: "Ask questions grounded in your documents with strict evidence verification, citation inspection, and Qdrant vector retrieval.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas-bg font-sans text-on-surface antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
