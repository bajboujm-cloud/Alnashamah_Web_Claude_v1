import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedForm } from "@/components/admin/BreedForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireStaff } from "@/server/auth/staff";
import { adminCategories } from "@/server/admin-data";

export default async function NewBreedPage({ params }: PageProps<"/[lang]/admin/breeds/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireStaff(lang, "catalog.prices");
  const t = (await getDictionary(lang)).admin;
  const categories = await adminCategories();
  return (
    <>
      <Link href={`/${lang}/admin/breeds`} className="text-sm text-gold-deep underline">
        ← {t.common.back}
      </Link>
      <PageTitle title={t.breeds.newTitle} />
      <BreedForm lang={lang} t={t} breed={null} categories={categories} canStructure />
    </>
  );
}
