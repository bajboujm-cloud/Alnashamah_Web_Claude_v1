import "server-only";
import { randomInt } from "node:crypto";
import { env } from "@/server/env";

/**
 * Sends and checks login codes. "console" (laptop): we make the code, keep only its HMAC and print it
 * in the terminal. "twilio" (go-live): Twilio Verify sends the SMS and checks the code itself.
 * Switch with OTP_PROVIDER — no code changes.
 */
export type OtpProvider = {
  /** Sends a code. Returns the code only when we generated it (console provider). */
  send(phone: string): Promise<{ code: string | null }>;
  /** Only for providers that keep the code themselves. */
  check?(phone: string, code: string): Promise<boolean>;
};

const consoleProvider: OtpProvider = {
  async send(phone) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    console.info(`[login code] ${phone}: ${code}`);
    return { code };
  },
};

function twilioProvider(): OtpProvider {
  const sid = env.TWILIO_VERIFY_SERVICE_SID as string;
  const auth = `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64")}`;
  const call = async (path: string, form: Record<string, string>) => {
    const res = await fetch(`https://verify.twilio.com/v2/Services/${sid}/${path}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok && res.status !== 404) throw new Error(`Twilio Verify error ${res.status}`);
    return res.ok ? ((await res.json()) as { status?: string }) : { status: "not_found" };
  };
  return {
    async send(phone) {
      await call("Verifications", { To: phone, Channel: "sms" });
      return { code: null };
    },
    async check(phone, code) {
      const r = await call("VerificationCheck", { To: phone, Code: code });
      return r.status === "approved";
    },
  };
}

export const otpProvider: OtpProvider = env.OTP_PROVIDER === "twilio" ? twilioProvider() : consoleProvider;

/** On the laptop the code is also shown on screen (never with a real SMS provider or in production). */
export const showCodeOnScreen =
  env.OTP_PROVIDER === "console" && (env.NODE_ENV !== "production" || env.OTP_SHOW_CODE);
