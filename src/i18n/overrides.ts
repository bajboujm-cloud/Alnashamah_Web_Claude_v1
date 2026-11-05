/** Sections of the website wording that can be edited in the admin panel (not the admin's own texts). */
export const EDITABLE_SECTIONS = [
  "meta",
  "nav",
  "home",
  "catalog",
  "order",
  "cart",
  "footer",
  "errors",
] as const;
export type EditableSection = (typeof EDITABLE_SECTIONS)[number];

/** { home: { steps: [{ title: "Choose" }] } } → { "home.steps.0.title": "Choose" } */
export function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (value && typeof value === "object") {
    return Object.entries(value).reduce<Record<string, string>>(
      (acc, [k, v]) => Object.assign(acc, flatten(v, prefix ? `${prefix}.${k}` : k)),
      {},
    );
  }
  return {};
}

const isEditableKey = (key: string) => EDITABLE_SECTIONS.some((s) => key === s || key.startsWith(`${s}.`));

/** Returns a copy of the dictionary with edited texts applied. Unknown keys and admin texts are ignored. */
export function applyOverrides<T>(dict: T, overrides: Record<string, string>): T {
  const copy = structuredClone(dict) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    if (!isEditableKey(key) || !value.trim()) continue;
    const parts = key.split(".");
    let node: unknown = copy;
    for (const part of parts.slice(0, -1)) {
      node = node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
    }
    const last = parts[parts.length - 1];
    if (node && typeof node === "object" && typeof (node as Record<string, unknown>)[last] === "string") {
      (node as Record<string, unknown>)[last] = value;
    }
  }
  return copy as T;
}
