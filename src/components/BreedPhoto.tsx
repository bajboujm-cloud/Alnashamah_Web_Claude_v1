import Image from "next/image";

/** One photo per breed; until it is uploaded a branded placeholder is shown. */
export function BreedPhoto({
  src,
  alt,
  placeholderLabel,
  priority = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  placeholderLabel: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-ivory-200 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover"
          unoptimized={src.endsWith(".svg")}
          priority={priority}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <Image src="/brand/mark.png" alt="" width={140} height={72} className="h-auto w-28 opacity-40" />
          <span className="text-xs text-muted">{placeholderLabel}</span>
        </div>
      )}
    </div>
  );
}
