import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Navbar } from "@/components/navbar";
import { PostHogBoot } from "@/components/analytics/posthog-boot";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { userId: clerkId } = await auth();
  const internalUserId = clerkId ? (await getCurrentUser()).id : null;

  return (
    <ClerkProvider signInUrl="/login">
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <PostHogBoot userId={internalUserId} />
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
