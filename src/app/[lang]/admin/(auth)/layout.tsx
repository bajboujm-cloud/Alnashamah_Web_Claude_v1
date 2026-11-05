import { Logo } from "@/components/Logo";
import { getBranding } from "@/server/branding";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBranding();
  return (
    <main id="main" className="flex flex-1 items-start justify-center bg-ivory px-4 py-12 sm:items-center">
      <div className="w-full max-w-md border border-line border-s-4 border-s-gold bg-white p-6 sm:p-8">
        <Logo src={brand.logo} alt="النشامى — Al Nashamah" priority className="mx-auto mb-6 h-14" />
        {children}
      </div>
    </main>
  );
}
