import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { SubmitButton, TextInput } from "@/components/admin/fields";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { readSession } from "@/server/auth/session";
import { loginAction } from "../../_actions/auth";

export default async function LoginPage({ params, searchParams }: PageProps<"/[lang]/admin/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  if (await readSession("active")) redirect(`/${lang}/admin`);
  const { expired } = await searchParams;
  const t = (await getDictionary(lang)).admin;

  return (
    <>
      <h1 className="font-display text-2xl text-green">{t.login.title}</h1>
      <div className="mb-6 mt-3 h-px bg-gold/70" />
      {expired ? <p className="mb-4 text-sm text-danger">{t.login.expired}</p> : null}
      <ActionForm action={loginAction} messages={{ ...t.msg, ...t.login }} className="space-y-4">
        <input type="hidden" name="lang" value={lang} />
        <TextInput
          label={t.login.email}
          name="email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
        />
        <TextInput
          label={t.login.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
        <SubmitButton>{t.login.submit}</SubmitButton>
      </ActionForm>
    </>
  );
}
