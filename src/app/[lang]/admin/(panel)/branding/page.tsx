import Image from "next/image";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { Checkbox, Field, inputClass, SubmitButton } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireStaff } from "@/server/auth/staff";
import { BRANDING_DEFAULTS, getBranding } from "@/server/branding";
import { saveBranding } from "../../_actions/branding";

export default async function BrandingPage({ params }: PageProps<"/[lang]/admin/branding">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireStaff(lang, "settings.edit");
  const t = (await getDictionary(lang)).admin;
  const b = await getBranding();
  const items = [
    {
      name: "logo_url",
      label: t.branding.logo,
      hint: t.branding.logoHelp,
      url: b.logo,
      def: BRANDING_DEFAULTS["brand.logo_url"],
      dark: false,
    },
    {
      name: "logo_reverse_url",
      label: t.branding.logoReverse,
      hint: t.branding.logoReverseHelp,
      url: b.logoReverse,
      def: BRANDING_DEFAULTS["brand.logo_reverse_url"],
      dark: true,
    },
    {
      name: "hero_image_url",
      label: t.branding.hero,
      hint: t.branding.heroHelp,
      url: b.heroImage,
      def: BRANDING_DEFAULTS["brand.hero_image_url"],
      dark: true,
    },
  ];

  return (
    <>
      <PageTitle title={t.branding.title} help={`${t.branding.help} ${t.branding.whatsappNote}`} />
      <ActionForm
        action={saveBranding}
        messages={t.msg}
        className="space-y-6 border border-line bg-white p-4 sm:p-6"
      >
        {items.map((i) => (
          <div key={i.name} className="border-b border-line pb-6" data-testid={`brand-${i.name}`}>
            <Field label={i.label} hint={i.hint}>
              <div
                className={`mb-3 flex h-28 items-center justify-center p-3 ${i.dark ? "bg-green" : "bg-ivory"}`}
              >
                <Image
                  src={i.url}
                  alt=""
                  width={1294}
                  height={459}
                  unoptimized={i.url.endsWith(".svg")}
                  className="h-full w-auto object-contain"
                />
              </div>
              <input
                type="file"
                name={i.name}
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                className={`${inputClass} max-w-sm`}
              />
            </Field>
            {i.url !== i.def ? (
              <div className="mt-2">
                <Checkbox
                  name={`remove_${i.name}`}
                  label={`${t.common.removeImage} (${t.branding.default})`}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">{t.branding.default}</p>
            )}
          </div>
        ))}
        <SubmitButton>{t.common.save}</SubmitButton>
      </ActionForm>
    </>
  );
}
