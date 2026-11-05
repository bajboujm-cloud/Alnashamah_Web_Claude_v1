import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { SubmitButton, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireStaff } from "@/server/auth/staff";
import { changePassword, signOutEverywhere } from "../../_actions/staff";

export default async function AccountPage({ params }: PageProps<"/[lang]/admin/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang, "dashboard.view");
  const t = (await getDictionary(lang)).admin;
  return (
    <>
      <PageTitle
        title={t.account.title}
        help={`${user.name} · ${user.email} · ${t.staff.roles[user.role]}`}
      />
      <section className="max-w-md border border-line bg-white p-4 sm:p-6">
        <h2 className="font-display mb-4 text-lg text-green">{t.account.changePassword}</h2>
        <ActionForm action={changePassword} messages={t.msg} resetOnSuccess className="space-y-4">
          <TextInput
            label={t.account.current}
            name="current"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
          />
          <TextInput
            label={t.account.new}
            hint={t.account.rules}
            name="new"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            dir="ltr"
          />
          <SubmitButton>{t.common.save}</SubmitButton>
        </ActionForm>
      </section>
      <form action={signOutEverywhere} className="mt-6">
        <input type="hidden" name="lang" value={lang} />
        <SubmitButton variant="quiet">{t.account.signOutAll}</SubmitButton>
      </form>
    </>
  );
}
