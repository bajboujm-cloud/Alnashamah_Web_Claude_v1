import { readStoredFile } from "@/server/storage";
import { contentTypes, type ImageKind } from "@/server/storage/validate";

/** Serves uploaded photos and illustrations from local storage. */
export async function GET(_req: Request, ctx: RouteContext<"/files/[...key]">) {
  const { key } = await ctx.params;
  const joined = key.join("/");
  const data = await readStoredFile(joined);
  if (!data) return new Response("Not found", { status: 404 });
  const ext = joined.split(".").pop() as ImageKind;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": contentTypes[ext],
      // File names are random and never reused, so they can be cached for a long time.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // An uploaded SVG opened directly can never run scripts.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
    },
  });
}
