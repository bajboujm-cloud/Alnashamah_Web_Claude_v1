import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { PhoneSignIn } from "@/components/PhoneSignIn";
import { SectionHeading } from "@/components/SectionHeading";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { readCustomer } from "@/server/customer/session";

export async function generateMetadata({ params }: PageProps<"/[lang]/account/login">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.account.loginTitle, robots: { index: false, follow: false } };
}

export default async function AccountLoginPage({ params }: PageProps<"/[lang]/account/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await readCustomer();
  if (me?.kind === "member") redirect(`/${lang}/account`);
  const t = await getDictionary(lang);
  return (
    <Container className="max-w-xl py-8 sm:py-12">
      <SectionHeading as="h1" title={t.account.loginTitle} />
      <p className="-mt-2 mb-6 text-sm text-muted">{t.account.loginText}</p>
      <div className="border border-line bg-white p-4 sm:p-6">
        <PhoneSignIn
          lang={lang}
          t={t.signIn}
          redirectTo={`/${lang}/account`}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
        />
      </div>
    </Container>
  );
}
