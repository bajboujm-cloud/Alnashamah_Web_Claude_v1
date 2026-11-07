import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoveButtons } from "@/components/admin/MoveButtons";
import { PageTitle } from "@/components/admin/PageTitle";
import { Switch } from "@/components/admin/Switch";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatAed, formatAge, formatWeight } from "@/lib/format";
import { can } from "@/server/auth/permissions";
import { requireStaff } from "@/server/auth/staff";
import { adminBreedsByCategory } from "@/server/admin-data";
import { setBreedAvailable, setBreedVisible, setOptionAvailable } from "../../_actions/breeds";

export default async function BreedsPage({ params }: PageProps<"/[lang]/admin/breeds">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang, "dashboard.view");
  const dict = await getDictionary(lang);
  const t = dict.admin;
  const cats = await adminBreedsByCategory();
  const canToggle = can(user.role, "stock.toggle");
  const canEdit = can(user.role, "catalog.content");
  const canAdd = can(user.role, "catalog.prices");
  const dash = "—";

  return (
    <>
      <PageTitle
        title={t.breeds.title}
        help={t.breeds.help}
        actions={
          canAdd ? (
            <Link
              href={`/${lang}/admin/breeds/new`}
              className="rounded-brand bg-green px-4 py-2 text-sm font-semibold text-ivory"
            >
              + {t.breeds.add}
            </Link>
          ) : null
        }
      />
      <div className="space-y-10">
        {cats
          .filter((c) => c.breeds.length || c.status === "active")
          .map((cat) => (
            <section key={cat.id}>
              <h2 className="font-display mb-3 text-xl text-green">{pick(lang, cat.nameEn, cat.nameAr)}</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {cat.breeds.map((b, i) => (
                  <article
                    key={b.id}
                    className={`min-w-0 border bg-white ${!b.isVisible ? "border-dashed border-muted bg-ivory/60" : b.isAvailable ? "border-line" : "border-danger/40"}`}
                    data-testid="admin-breed"
                    data-slug={`${cat.slug}/${b.slug}`}
                  >
                    <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line p-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden bg-ivory-200">
                        <Image
                          src={b.photoUrl ?? "/brand/mark.png"}
                          alt=""
                          fill
                          sizes="64px"
                          className={b.photoUrl ? "object-cover" : "object-contain p-1 opacity-40"}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-green">{pick(lang, b.nameEn, b.nameAr)}</p>
                        {!b.isVisible ? (
                          <p className="text-xs font-semibold text-muted" data-testid="hidden-note">
                            {t.breeds.hiddenNote}
                          </p>
                        ) : null}
                        {canEdit ? (
                          <Link
                            href={`/${lang}/admin/breeds/${b.id}`}
                            className="text-xs text-gold-deep underline"
                          >
                            {t.common.edit}
                          </Link>
                        ) : null}
                      </div>
                      {canAdd ? (
                        <MoveButtons
                          kind="breed"
                          id={b.id}
                          first={i === 0}
                          last={i === cat.breeds.length - 1}
                          labels={{ up: t.common.moveUp, down: t.common.moveDown }}
                        />
                      ) : null}
                      {/* Switches on their own line so the header never gets too wide on phones. */}
                      <div className="flex basis-full flex-wrap items-center gap-x-5">
                        {canToggle ? (
                          <Switch
                            checked={b.isAvailable}
                            label={`${pick(lang, b.nameEn, b.nameAr)} — ${t.common.toggleHint}`}
                            onLabel={t.common.available}
                            offLabel={t.common.outOfStock}
                            action={setBreedAvailable.bind(null, b.id)}
                            testId="breed-switch"
                          />
                        ) : null}
                        {canAdd ? (
                          <Switch
                            checked={b.isVisible}
                            label={`${pick(lang, b.nameEn, b.nameAr)} — ${t.common.visibilityHint}`}
                            onLabel={t.common.shown}
                            offLabel={t.common.hiddenLabel}
                            action={setBreedVisible.bind(null, b.id)}
                            testId="breed-visibility-switch"
                          />
                        ) : null}
                      </div>
                    </header>
                    <ul className="divide-y divide-line">
                      {b.options.map((o) => (
                        <li
                          key={o.id}
                          className={`flex items-center gap-3 px-3 py-1.5 text-sm ${
                            b.isAvailable ? "" : "opacity-50"
                          }`}
                          data-testid="admin-size"
                        >
                          <span className="w-20 shrink-0 font-semibold">
                            {pick(lang, o.labelEn, o.labelAr) ?? dash}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs text-muted">
                            {formatAge(o.ageMinMonths, o.ageMaxMonths, lang) ?? dash} ·{" "}
                            {formatWeight(o.weightMinKg, o.weightMaxKg, lang) ?? dash} ·{" "}
                            <span className="text-charcoal">
                              {o.priceFils != null ? formatAed(o.priceFils, lang) : dict.catalog.priceSoon}
                            </span>
                          </span>
                          {canToggle ? (
                            <Switch
                              checked={o.isAvailable}
                              label={`${pick(lang, b.nameEn, b.nameAr)} ${pick(lang, o.labelEn, o.labelAr) ?? ""} — ${t.common.toggleHint}`}
                              onLabel={t.common.available}
                              offLabel={t.common.outOfStock}
                              action={setOptionAvailable.bind(null, o.id)}
                              testId="size-switch"
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
      </div>
    </>
  );
}
