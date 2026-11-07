/** Basic email check (the address is confirmed for real when we send the invoice). */
export const isEmail = (v: string) => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
