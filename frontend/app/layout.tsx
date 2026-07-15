import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoWrite — Collaborative Docs",
  description: "Real-time collaborative documents and code. Work together, anywhere.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%236366f1'/><path d='M8 10h16M8 16h12M8 22h8' stroke='white' stroke-width='2.5' stroke-linecap='round'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
