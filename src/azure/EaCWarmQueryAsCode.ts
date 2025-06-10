import { EaCDetails, EaCDetailsSchema, z } from "./.deps.ts";
import {
  EaCWarmQueryDetails,
  EaCWarmQueryDetailsSchema,
} from "./EaCWarmQueryDetails.ts";

/**
 * Represents a warm query configuration in Everything-as-Code (EaC).
 * Warm queries define pre-computed or reusable queries that can be triggered within the system.
 */
export type EaCWarmQueryAsCode = EaCDetails<EaCWarmQueryDetails>;

/**
 * Schema for `EaCWarmQueryAsCode`.
 * Replaces `Details` from base `EaCDetailsSchema` with a narrowed warm query schema.
 */
export const EaCWarmQueryAsCodeSchema: z.ZodType<EaCWarmQueryAsCode> =
  EaCDetailsSchema.extend({
    Details: EaCWarmQueryDetailsSchema.optional(),
  })
    .strip()
    .describe(
      "Schema for warm query configuration in Everything-as-Code (EaC).",
    );

/**
 * Type guard for `EaCWarmQueryAsCode`.
 */
export function isEaCWarmQueryAsCode(
  value: unknown,
): value is EaCWarmQueryAsCode {
  return EaCWarmQueryAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCWarmQueryAsCode`.
 */
export function parseEaCWarmQueryAsCode(value: unknown): EaCWarmQueryAsCode {
  return EaCWarmQueryAsCodeSchema.parse(value);
}
