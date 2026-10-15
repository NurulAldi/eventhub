import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | EventHub Kampus",
    default: "EventHub Kampus - Platform Event & Kegiatan Kampus",
  },
  description: "Temukan dan ikuti berbagai event, seminar, workshop, dan kompetisi kampus terbaik.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AuthProvider>
          <Suspense fallback={<div className="h-20 bg-white border-b border-gray-200" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col bg-gray-50">{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
