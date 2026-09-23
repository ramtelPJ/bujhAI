import Image from "next/image";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  return (
    <nav className="bg-white border-b-2 md:border-b-4 border-black px-4 md:px-8 lg:px-12">
      <div className="flex items-center justify-between max-w-6xl mx-auto gap-4 md:gap-6 py-4 md:py-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="bujhAI"
            width={217}
            height={72}
            priority
            className="h-8 md:h-10 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4 md:gap-6 font-mono text-xs md:text-sm uppercase tracking-wider">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
          <Show when="signed-in">
            <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
              Upload Document
            </Link>
          </Show>
          <Show when="signed-out">
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Upload Document
            </Link>
          </Show>
        </div>
      </div>
    </nav>
  );
}
