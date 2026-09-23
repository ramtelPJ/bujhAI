import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
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
  title: "bujhAI",
  description: "Understand paperwork and get the next step done.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider signInUrl="/login">
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
