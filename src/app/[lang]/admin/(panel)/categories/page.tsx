import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Select, SubmitButton, TextArea, TextInput } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/ImageField";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale, pick } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/dictionaries";
import { can } from "@/server/auth/permissions";
import { requireStaff } from "@/server/auth/staff";
import { adminCategories } from "@/server/admin-data";
import { deleteCategory, saveCategory } from "../../_actions/catalog";

type Cat = Awaited<ReturnType<typeof adminCategories>>[number];

function CategoryForm({ t, c, full }: { t: Dictionary["admin"]; c: Cat | null; full: boolean }) {
  return (
    <ActionForm action={saveCategory} messages={t.msg} resetOnSuccess={!c} className="space-y-4">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={t.common.nameEn} name="nameEn" defaultValue={c?.nameEn} required dir="ltr" />
        <TextInput label={t.common.nameAr} name="nameAr" defaultValue={c?.nameAr} required dir="rtl" />
        {full ? (
          <>
            <TextInput
              label={t.common.slug}
              hint={t.common.slugHelp}
              name="slug"
              defaultValue={c?.slug}
              required
              dir="ltr"
            />
            <Select
              label={t.categories.status}
              name="status"
              defaultValue={c?.status ?? "coming_soon"}
              options={[
                { value: "active", label: t.categories.active },
                { value: "coming_soon", label: t.categories.comingSoon },
                { value: "hidden", label: t.categories.hidden },
              ]}
            />
          </>
        ) : null}
        <TextArea
          label={t.common.descriptionEn}
          name="descriptionEn"
          defaultValue={c?.descriptionEn}
          dir="ltr"
        />
        <TextArea
          label={t.common.descriptionAr}
          name="descriptionAr"
          defaultValue={c?.descriptionAr}
          dir="rtl"
        />
      </div>
      <ImageField
        label={t.common.illustration}
        hint={t.common.uploadSvgHelp}
        name="illustration"
        current={c?.illustrationUrl ?? null}
        removeLabel={t.common.removeImage}
        accept="image/svg+xml,image/jpeg,image/png,image/webp"
      />
      <SubmitButton>{c ? t.common.save : t.common.add}</SubmitButton>
    </ActionForm>
  );
}

export default async function CategoriesPage({ params }: PageProps<"/[lang]/admin/categories">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang, "catalog.content");
  const t = (await getDictionary(lang)).admin;
  const cats = await adminCategories();
  const full = can(user.role, "catalog.prices");

  return (
    <>
      <PageTitle title={t.categories.title} />
      <div className="space-y-4">
        {cats.map((c) => (
          <details key={c.id} className="border border-line bg-white" data-testid="admin-category">
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
              <span className="font-semibold text-green">{pick(lang, c.nameEn, c.nameAr)}</span>
              <span className="text-xs text-muted">
                {c.status === "active"
                  ? t.categories.active
                  : c.status === "coming_soon"
                    ? t.categories.comingSoon
                    : t.categories.hidden}{" "}
                · {c.breeds.length} {t.categories.breedCount}
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <CategoryForm t={t} c={c} full={full} />
              {full ? (
                <ActionForm
                  action={deleteCategory}
                  messages={t.msg}
                  className="mt-4 border-t border-line pt-4"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton question={t.common.confirmDelete}>{t.common.delete}</ConfirmButton>
                </ActionForm>
              ) : null}
            </div>
          </details>
        ))}
      </div>
      {full ? (
        <section className="mt-10 border border-dashed border-gold bg-white p-4">
          <h2 className="font-display mb-4 text-lg text-green">{t.categories.newTitle}</h2>
          <CategoryForm t={t} c={null} full />
        </section>
      ) : null}
    </>
  );
}
