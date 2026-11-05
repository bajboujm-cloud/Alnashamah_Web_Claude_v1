import Image from "next/image";

/**
 * One photo per breed, always shown as a 4:3 landscape box that the photo fills edge to edge
 * (cropped, never stretched). Best upload: 1600 × 1200 px. Until a photo is uploaded a branded
 * placeholder is shown. `sizes` tells the browser how wide the box is so phones download a small copy.
 */
export function BreedPhoto({
  src,
  alt,
  placeholderLabel,
  priority = false,
  className = "",
  sizes = "(max-width: 1024px) 50vw, 25vw",
}: {
  src: string | null;
  alt: string;
  placeholderLabel: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-ivory-200 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
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
