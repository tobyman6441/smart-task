import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Goal Canvas",
  description: "Voice-powered task management",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${workSans.variable} antialiased pb-16 md:pb-0`}>
        <div className="flex md:flex-row">
          <BottomNav />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
} 