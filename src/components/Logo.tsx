import Image from "next/image";

/** Logo that keeps its own proportions at a fixed height (uploaded logos can have any shape). */
export function Logo({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1294}
      height={459}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={`w-auto object-contain ${className}`}
    />
  );
}
