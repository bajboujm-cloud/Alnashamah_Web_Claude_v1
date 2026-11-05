import type { Dictionary } from "@/i18n/dictionaries";
import { deleteOption, moveOption, saveOption } from "@/app/[lang]/admin/_actions/breeds";
import { ActionForm } from "./ActionForm";
import { ConfirmButton } from "./ConfirmButton";
import { SubmitButton, TextInput } from "./fields";

type Option = {
  id: string;
  labelEn: string | null;
  labelAr: string | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  weightMinKg: number | null;
  weightMaxKg: number | null;
  priceFils: number | null;
  compareAtPriceFils: number | null;
};

const aed = (fils: number | null) => (fils == null ? "" : String(fils / 100));

/** One size (age + weight + price) of a breed, with save, move and delete. */
export function SizeRow({
  t,
  o,
  first,
  last,
}: {
  t: Dictionary["admin"];
  o: Option;
  first: boolean;
  last: boolean;
}) {
  const b = t.breeds;
  return (
    <div className="border border-line bg-white p-4" data-testid="size-form">
      <ActionForm action={saveOption} messages={t.msg} className="space-y-3">
        <input type="hidden" name="id" value={o.id} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TextInput label={b.labelEn} name="labelEn" defaultValue={o.labelEn ?? ""} dir="ltr" />
          <TextInput label={b.labelAr} name="labelAr" defaultValue={o.labelAr ?? ""} dir="rtl" />
          <TextInput
            label={b.ageFrom}
            name="ageMinMonths"
            defaultValue={o.ageMinMonths ?? ""}
            inputMode="numeric"
            dir="ltr"
          />
          <TextInput
            label={b.ageTo}
            name="ageMaxMonths"
            defaultValue={o.ageMaxMonths ?? ""}
            inputMode="numeric"
            dir="ltr"
          />
          <TextInput
            label={b.weightFrom}
            name="weightMinKg"
            defaultValue={o.weightMinKg ?? ""}
            inputMode="decimal"
            dir="ltr"
          />
          <TextInput
            label={b.weightTo}
            name="weightMaxKg"
            defaultValue={o.weightMaxKg ?? ""}
            inputMode="decimal"
            dir="ltr"
          />
          <TextInput
            label={t.common.priceAed}
            hint={t.common.priceEmpty}
            name="priceAed"
            defaultValue={aed(o.priceFils)}
            inputMode="decimal"
            dir="ltr"
          />
          <TextInput
            label={b.oldPrice}
            name="compareAtAed"
            defaultValue={aed(o.compareAtPriceFils)}
            inputMode="decimal"
            dir="ltr"
          />
        </div>
        <SubmitButton>{t.common.save}</SubmitButton>
      </ActionForm>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
        {!first && (
          <form action={moveOption}>
            <input type="hidden" name="id" value={o.id} />
            <input type="hidden" name="dir" value="up" />
            <SubmitButton variant="quiet">↑ {t.common.moveUp}</SubmitButton>
          </form>
        )}
        {!last && (
          <form action={moveOption}>
            <input type="hidden" name="id" value={o.id} />
            <input type="hidden" name="dir" value="down" />
            <SubmitButton variant="quiet">↓ {t.common.moveDown}</SubmitButton>
          </form>
        )}
        <form action={deleteOption} className="ms-auto">
          <input type="hidden" name="id" value={o.id} />
          <ConfirmButton question={t.common.confirmDelete}>{b.deleteSize}</ConfirmButton>
        </form>
      </div>
    </div>
  );
}
