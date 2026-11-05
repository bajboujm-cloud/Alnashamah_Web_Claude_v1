import type en from "@/i18n/dictionaries/en.json";

export type MsgKey = keyof (typeof en)["admin"]["msg"] | keyof (typeof en)["admin"]["login"];

/** Result returned by every admin Server Action used with <ActionForm>. */
export type FormState = {
  status: "idle" | "ok" | "error";
  msg?: MsgKey;
  /** Field names with a problem, highlighted in the form. */
  fields?: string[];
  /** Extra text shown with the message (e.g. a one-time password). */
  extra?: string;
  /** Changes on every submit so the form can react even when the message is the same. */
  at?: number;
};

export const idle: FormState = { status: "idle" };
