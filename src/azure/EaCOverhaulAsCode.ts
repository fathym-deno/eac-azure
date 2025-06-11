import { EaCDetails, EaCDetailsSchema, z } from "./.deps.ts";
import {
  EaCOverhaulDetails,
  EaCOverhaulDetailsSchema,
} from "./EaCOverhaulDetails.ts";

/**
 * Represents an Overhaul configuration in Everything-as-Code (EaC).
 * This is a vertex-only construct for tracking system change strategy or transformation boundaries.
 */
export type EaCOverhaulAsCode = EaCDetails<EaCOverhaulDetails>;

/**
 * Schema for `EaCOverhaulAsCode`.
 * Replaces `Details` from base `EaCDetailsSchema` with `EaCOverhaulDetailsSchema`.
 */
export const EaCOverhaulAsCodeSchema: z.ZodType<EaCOverhaulAsCode> =
  EaCDetailsSchema.extend({
    Details: EaCOverhaulDetailsSchema.optional(),
  })
    .strip()
    .describe("Schema for overhaul configuration in Everything-as-Code (EaC).");

/**
 * Type guard for `EaCOverhaulAsCode`.
 */
export function isEaCOverhaulAsCode(
  value: unknown,
): value is EaCOverhaulAsCode {
  return EaCOverhaulAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCOverhaulAsCode`.
 */
export function parseEaCOverhaulAsCode(
  value: unknown,
): EaCOverhaulAsCode {
  return EaCOverhaulAsCodeSchema.parse(value);
}
