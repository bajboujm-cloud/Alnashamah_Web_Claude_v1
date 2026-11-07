/** Brand-kit section heading: bold title, small tracked label, thin gold hairline. */
export function SectionHeading({
  title,
  label,
  id,
  as: Tag = "h2",
}: {
  title: string;
  label?: string;
  id?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-5 sm:mb-8">
      <Tag id={id} className="font-display text-2xl text-green sm:text-3xl">
        {title}
      </Tag>
      {label ? <p className="label-tracked mt-2">{label}</p> : null}
      <div className="mt-3 h-px w-full bg-gold/70 sm:mt-4" aria-hidden />
    </div>
  );
}
