/** Business settings editable in the admin panel (stored in the `settings` table). */
export const SETTING_KEYS = [
  "company.legal_name_en",
  "company.legal_name_ar",
  "company.trn",
  "company.trade_license_no",
  "company.address_en",
  "company.address_ar",
  "company.phone",
  "company.whatsapp",
  "company.email",
  "tax.vat_rate_percent",
  "tax.prices_include_vat",
] as const;
