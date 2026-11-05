import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex flex-1 items-start justify-center bg-ivory px-4 py-12 sm:items-center">
      <div className="w-full max-w-md border border-line border-s-4 border-s-gold bg-white p-6 sm:p-8">
        <Image
          src="/brand/logo-horizontal.png"
          alt="النشامى — Al Nashamah"
          width={1294}
          height={459}
          priority
          className="mx-auto mb-6 h-14 w-auto"
        />
        {children}
      </div>
    </main>
  );
}
