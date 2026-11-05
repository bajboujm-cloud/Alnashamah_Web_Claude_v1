import type { Locale } from "@/i18n/config";
import { pick } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { saveBreed } from "@/app/[lang]/admin/_actions/breeds";
import { ActionForm } from "./ActionForm";
import { Select, SubmitButton, TextArea, TextInput } from "./fields";
import { ImageField } from "./ImageField";

type Breed = {
  id: string;
  categoryId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  photoUrl: string | null;
};

export function BreedForm({
  lang,
  t,
  breed,
  categories,
  canStructure,
}: {
  lang: Locale;
  t: Dictionary["admin"];
  breed: Breed | null;
  categories: { id: string; nameEn: string; nameAr: string }[];
  canStructure: boolean;
}) {
  return (
    <ActionForm
      action={saveBreed}
      messages={t.msg}
      className="space-y-4 border border-line bg-white p-4 sm:p-6"
    >
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="id" value={breed?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={t.common.nameEn} name="nameEn" defaultValue={breed?.nameEn} required dir="ltr" />
        <TextInput label={t.common.nameAr} name="nameAr" defaultValue={breed?.nameAr} required dir="rtl" />
        {canStructure ? (
          <>
            <Select
              label={t.breeds.category}
              name="categoryId"
              defaultValue={breed?.categoryId}
              options={categories.map((c) => ({ value: c.id, label: pick(lang, c.nameEn, c.nameAr) }))}
            />
            <TextInput
              label={t.common.slug}
              hint={t.common.slugHelp}
              name="slug"
              defaultValue={breed?.slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              dir="ltr"
            />
          </>
        ) : null}
        <TextArea
          label={t.common.descriptionEn}
          name="descriptionEn"
          defaultValue={breed?.descriptionEn}
          dir="ltr"
        />
        <TextArea
          label={t.common.descriptionAr}
          name="descriptionAr"
          defaultValue={breed?.descriptionAr}
          dir="rtl"
        />
      </div>
      <ImageField
        label={t.common.photo}
        hint={t.common.uploadHelp}
        name="photo"
        current={breed?.photoUrl ?? null}
        removeLabel={t.common.removeImage}
      />
      <SubmitButton>{t.common.save}</SubmitButton>
    </ActionForm>
  );
}
