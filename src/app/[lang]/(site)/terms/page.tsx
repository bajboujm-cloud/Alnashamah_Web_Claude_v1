import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { termsSections, TERMS_VERSION } from "@/content/terms";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternates } from "@/lib/site";
import { getCompany } from "@/server/company";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.terms.title, alternates: alternates(lang, "/terms") };
}

export default async function TermsPage({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await connection(); // company details are live from the admin settings
  const [t, company] = await Promise.all([getDictionary(lang), getCompany()]);
  const sections = termsSections(lang, company);
  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <SectionHeading as="h1" title={t.terms.title} />
      <p className="-mt-2 mb-8 text-sm text-muted">
        {t.terms.updated.replace("{date}", TERMS_VERSION[lang])}
      </p>
      <div className="space-y-8" data-testid="terms">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display mb-3 text-xl text-green">{s.title}</h2>
            <div className="space-y-3 leading-relaxed text-charcoal">
              {s.body.map((b, i) =>
                Array.isArray(b) ? (
                  <ul key={i} className="list-disc space-y-2 ps-6">
                    {b.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{b}</p>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
