import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard", label: "Upload Document" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export function Footer() {
  return (
    <footer className="bg-black text-white py-12 md:py-24 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div>
          <Link href="/" className="inline-block bg-white border-2 md:border-4 border-black p-2 md:p-3">
            <Image
              src="/logo.png"
              alt="bujhAI"
              width={217}
              height={72}
              className="h-7 md:h-9 w-auto"
            />
          </Link>
          <p className="font-mono text-xs md:text-sm mt-3 text-white/70 max-w-xs">
            Understand paperwork. Get it done.
          </p>
        </div>
        <div>
          <h4 className="font-black tracking-tight text-xl md:text-2xl">
            Product
          </h4>
          <ul className="font-mono text-xs md:text-sm mt-2 flex flex-col gap-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
