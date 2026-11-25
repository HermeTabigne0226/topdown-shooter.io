import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CYBERSTORM // Neon Survivor",
  description: "Fast-paced top-down tactical shooter built with Next.js, HTML5 Canvas, and Web Audio API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-black text-white antialiased overflow-hidden select-none">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full w-full overflow-hidden bg-black font-sans`}>
        {children}
      </body>
    </html>
  );
}
