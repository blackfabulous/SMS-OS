import { Prisma } from "@prisma/client";

/**
 * Convert an unknown value into a Prisma Json input type.
 * Prisma's `Json` input type uses `NullableJsonNullValueInput` for nulls
 * (`Prisma.JsonNull`) rather than JavaScript `null`.
 */
export function toJsonInput(
  value: unknown
): Prisma.InputJsonValue | Prisma.JsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}
