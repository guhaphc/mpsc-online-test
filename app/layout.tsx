import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MPSC / UPSC AI Answer Checker",
  description: "AI-powered descriptive answer evaluation"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
