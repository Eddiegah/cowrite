import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoWrite — Collaborative Docs",
  description: "Real-time collaborative documents and code. Work together, anywhere.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('cowrite_theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
