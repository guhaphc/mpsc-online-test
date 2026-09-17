import "./globals.css";
import type { Metadata } from "next";
import MainsPdfActions from "./components/MainsPdfActions";

export const metadata: Metadata = {
  title: "MPSC / UPSC AI Answer Checker",
  description: "AI-powered descriptive answer evaluation"
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}<MainsPdfActions /></body></html>;
}
