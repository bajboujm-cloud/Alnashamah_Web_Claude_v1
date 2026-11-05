import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { ActionForm } from "@/components/admin/ActionForm";
import { SubmitButton, TextInput } from "@/components/admin/fields";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { decrypt, encrypt } from "@/server/auth/crypto";
import { readSession } from "@/server/auth/session";
import { newTotpSecret, totpUri } from "@/server/auth/totp";
import { db, schema as s } from "@/server/db";
import { env } from "@/server/env";
import { verifyCodeAction } from "../../_actions/auth";

export default async function TwoFactorPage({ params }: PageProps<"/[lang]/admin/two-factor">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await readSession("pending");
  if (!user) redirect(`/${lang}/admin/login?expired=1`);
  const t = (await getDictionary(lang)).admin;

  // First sign-in: create the authenticator secret (stored encrypted) and show it as a QR code.
  let setup: { qr: string; key: string } | null = null;
  if (!user.totpEnabled) {
    let secret = user.totpSecretEnc ? decrypt(user.totpSecretEnc, env.AUTH_SECRET) : null;
    if (!secret) {
      secret = newTotpSecret();
      await db
        .update(s.staffUsers)
        .set({ totpSecretEnc: encrypt(secret, env.AUTH_SECRET) })
        .where(eq(s.staffUsers.id, user.id));
    }
    const qr = await QRCode.toString(totpUri(secret, user.email), {
      type: "svg",
      margin: 1,
      color: { dark: "#0F3D32", light: "#FFFFFF" },
    });
    setup = { qr, key: secret.replace(/(.{4})/g, "$1 ").trim() };
  }

  return (
    <>
      <h1 className="font-display text-2xl text-green">{setup ? t.login.setupTitle : t.login.codeTitle}</h1>
      <div className="mb-6 mt-3 h-px bg-gold/70" />
      {setup ? (
        <ol className="mb-6 list-decimal space-y-3 ps-5 text-sm">
          <li>{t.login.setup1}</li>
          <li>
            {t.login.setup2}
            <div
              className="mx-auto mt-3 w-48 border border-line p-2"
              aria-label="QR code"
              data-testid="totp-qr"
              dangerouslySetInnerHTML={{ __html: setup.qr }}
            />
            <p className="mt-3 text-xs text-muted">{t.login.manualKey}</p>
            <code className="block select-all break-all font-mono text-sm" dir="ltr" data-testid="totp-key">
              {setup.key}
            </code>
          </li>
          <li>{t.login.setup3}</li>
        </ol>
      ) : (
        <p className="mb-4 text-sm text-muted">{t.login.codeHelp}</p>
      )}
      <ActionForm action={verifyCodeAction} messages={{ ...t.msg, ...t.login }} className="space-y-4">
        <input type="hidden" name="lang" value={lang} />
        <TextInput
          label={t.login.code}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          dir="ltr"
          className="text-center text-2xl tracking-[0.4em]"
        />
        <SubmitButton>{t.login.verify}</SubmitButton>
      </ActionForm>
      <Link href={`/${lang}/admin/login`} className="mt-6 inline-block text-sm text-gold-deep underline">
        {t.login.startOver}
      </Link>
    </>
  );
}
