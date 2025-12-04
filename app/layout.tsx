import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrum Poker Table",
  description: "Lightweight poker-themed scrum poker room built with Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-table via-[#0d1e2d] to-table text-white">
        {children}
      </body>
    </html>
  );
}
