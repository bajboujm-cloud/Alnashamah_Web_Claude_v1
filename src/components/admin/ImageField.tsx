import Image from "next/image";
import { Checkbox, Field, inputClass } from "./fields";

/** Current image preview + file picker + "remove" tick box. */
export function ImageField({
  label,
  hint,
  name,
  current,
  removeLabel,
  accept = "image/jpeg,image/png,image/webp",
}: {
  label: string;
  hint: string;
  name: string;
  current: string | null;
  removeLabel: string;
  accept?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        {current ? (
          <div className="relative aspect-[4/3] w-32 overflow-hidden border border-line bg-ivory-200">
            <Image
              src={current}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
              unoptimized={current.endsWith(".svg")}
            />
          </div>
        ) : null}
        <input type="file" name={name} accept={accept} className={`${inputClass} max-w-xs`} />
        {current ? (
          <Checkbox name={`remove${name[0].toUpperCase()}${name.slice(1)}`} label={removeLabel} />
        ) : null}
      </div>
    </Field>
  );
}
