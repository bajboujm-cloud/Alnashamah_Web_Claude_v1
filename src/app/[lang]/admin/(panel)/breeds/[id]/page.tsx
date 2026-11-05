import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedForm } from "@/components/admin/BreedForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/PageTitle";
import { SizeRow } from "@/components/admin/SizeRow";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { can } from "@/server/auth/permissions";
import { requireStaff } from "@/server/auth/staff";
import { adminBreed, adminCategories } from "@/server/admin-data";
import { addOption, deleteBreed } from "../../../_actions/breeds";

export default async function EditBreedPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin/breeds/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang, "catalog.content");
  const [breed, categories] = await Promise.all([adminBreed(id), adminCategories()]);
  if (!breed) notFound();
  const { created } = await searchParams;
  const t = (await getDictionary(lang)).admin;
  const full = can(user.role, "catalog.prices");
  const category = categories.find((c) => c.id === breed.categoryId);

  return (
    <>
      <Link href={`/${lang}/admin/breeds`} className="text-sm text-gold-deep underline">
        ← {t.common.back}
      </Link>
      <PageTitle
        title={`${pick(lang, breed.nameEn, breed.nameAr)}${category ? ` · ${pick(lang, category.nameEn, category.nameAr)}` : ""}`}
      />
      {created ? (
        <p role="status" className="mb-4 rounded-brand border border-green/30 px-3 py-2 text-sm text-green">
          {t.msg.saved}
        </p>
      ) : null}

      <h2 className="font-display mb-3 text-lg text-green">{t.breeds.details}</h2>
      <BreedForm lang={lang} t={t} breed={breed} categories={categories} canStructure={full} />

      {full ? (
        <section className="mt-10">
          <h2 className="font-display text-lg text-green">{t.breeds.sizes}</h2>
          <p className="mb-3 text-sm text-muted">{t.breeds.sizesHelp}</p>
          <div className="space-y-3">
            {breed.options.length === 0 ? <p className="text-sm text-muted">{t.breeds.noSizes}</p> : null}
            {breed.options.map((o, i) => (
              <SizeRow key={o.id} t={t} o={o} first={i === 0} last={i === breed.options.length - 1} />
            ))}
          </div>
          <form action={addOption} className="mt-3">
            <input type="hidden" name="breedId" value={breed.id} />
            <SubmitButton variant="quiet">+ {t.breeds.addSize}</SubmitButton>
          </form>

          <form action={deleteBreed} className="mt-12 border-t border-line pt-6">
            <input type="hidden" name="id" value={breed.id} />
            <input type="hidden" name="lang" value={lang} />
            <ConfirmButton question={t.common.confirmDelete}>{t.breeds.deleteBreed}</ConfirmButton>
          </form>
        </section>
      ) : null}
    </>
  );
}
