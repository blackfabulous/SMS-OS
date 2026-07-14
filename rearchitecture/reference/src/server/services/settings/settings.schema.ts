import { z } from "zod";

// Restricted set of setting keys. Add keys as the app grows.
export const SettingKey = z.enum([
  "finance.default_currency",
  "finance.payment_methods",
  "academics.grading_scale_default",
  "school.timezone",
  "school.contact_email",
  "school.contact_phone",
  "school.logo_url",
  "communications.default_channel",
]);

export const SettingValueSchema = z.record(z.unknown()).or(z.array(z.unknown())).or(z.string()).or(z.number()).or(z.boolean()).or(z.null());

export const createSettingSchema = z.object({
  key: SettingKey,
  value: z.unknown(),
});

export const updateSettingSchema = z.object({
  value: z.unknown(),
});

export const settingKeyParamSchema = z.object({
  key: SettingKey,
});

export type CreateSettingInput = z.infer<typeof createSettingSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type SettingKey = z.infer<typeof SettingKey>;

// Runtime validation of the value based on key.
export function validateSettingValue(key: SettingKey, value: unknown): boolean {
  switch (key) {
    case "finance.default_currency":
      return z.enum(["USD", "ZWG", "ZAR", "GBP", "EUR"]).safeParse(value).success;
    case "school.timezone":
      return z.string().safeParse(value).success;
    case "school.contact_email":
      return z.string().email().safeParse(value).success;
    case "communications.default_channel":
      return z.enum(["EMAIL", "SMS", "PUSH", "IN_APP", "WHATSAPP"]).safeParse(value).success;
    default:
      return true;
  }
}
